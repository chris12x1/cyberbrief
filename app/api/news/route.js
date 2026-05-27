import { GoogleGenAI } from '@google/genai'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import {
  getUser,
  checkAnonymousLimit,
  recordAnonymousRefresh,
  checkSignedInFreeLimit,
  recordSignedInRefresh,
  checkProLimit,
  recordProRefresh,
} from '../../lib/db'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

async function generateWithRetry(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      })
      return response
    } catch (err) {
      const is429 = err.message?.includes('429') || err.message?.includes('Too Many Requests')
      if (is429 && i < retries - 1) {
        await new Promise(r => setTimeout(r, 10000))
        continue
      }
      throw err
    }
  }
}

function formatTimeRemaining(minutes) {
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`
  return `${hours}h ${mins}m`
}

export async function POST(req) {
  const { userId } = await auth()
  const ip = getClientIp(req)

  let userIsPro = false

  if (!userId) {
    const limit = await checkAnonymousLimit(ip)
    if (!limit.allowed) {
      return NextResponse.json({
        error: `Free weekly refresh used. Sign up free for more, or upgrade to Pro for unlimited access. Try again in ${limit.hoursUntilNextRefresh} hours.`,
        isLimit: true,
      }, { status: 429 })
    }
  } else {
    const user = await getUser(userId)
    userIsPro = user?.is_pro || false

    if (!userIsPro) {
      const limit = await checkSignedInFreeLimit(userId)
      if (!limit.allowed) {
        return NextResponse.json({
          error: `Free weekly refresh used. Upgrade to Pro for unlimited access. Try again in ${limit.hoursUntilNextRefresh} hours.`,
          isLimit: true,
        }, { status: 429 })
      }
    } else {
      // Pro user — check 4-hour cooldown
      const limit = await checkProLimit(userId)
      if (!limit.allowed) {
        const timeStr = formatTimeRemaining(limit.minutesUntilNextRefresh)
        return NextResponse.json({
          error: `Pro refresh cooldown — please try again in ${timeStr}. News cycles update every few hours, so the data won't change much before then.`,
          isLimit: true,
        }, { status: 429 })
      }
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  try {
    const prompt = `You are a cybersecurity analyst. Today is ${today}.

Use Google Search to find the 8 most important cybersecurity news stories from the last 48 hours.

Return ONLY a valid JSON array — no markdown, no backticks, no explanation before or after.

Each object must have exactly these fields:
- title: string (the news headline)
- tldr: string (1-2 sentences, max 40 words)
- summary: string (3-5 sentences)
- severity: one of "critical" | "high" | "medium" | "low" | "info"
- category: one of "Vulnerabilities" | "Data Breaches" | "Malware" | "Nation-State" | "Zero-Day"
- source: string (e.g. "The Hacker News")
- date: string (e.g. "Apr 27")

Your entire response must be a raw JSON array starting with [ and ending with ]. Nothing else.`

    const result = await generateWithRetry(prompt)
    const text = result.text

    const match = text.match(/\[[\s\S]*\]/)
    if (!match) {
      return NextResponse.json(
        { error: 'No JSON array in model response.' },
        { status: 500 }
      )
    }

    const articles = JSON.parse(match[0])

    // Record the refresh AFTER successful fetch
    if (!userId) {
      await recordAnonymousRefresh(ip)
    } else if (!userIsPro) {
      await recordSignedInRefresh(userId)
    } else {
      await recordProRefresh(userId)
    }

    return NextResponse.json({ articles })
  } catch (err) {
    console.error('CyberBrief API error:', err)
    const is429 = err.message?.includes('429') || err.message?.includes('Too Many Requests')
    if (is429) {
      return NextResponse.json(
        { error: 'Service is busy — please wait 30 seconds and try again.' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
