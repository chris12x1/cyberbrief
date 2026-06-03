import { GoogleGenAI } from '@google/genai'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import {
  getUser, getUserNews, setUserNews,
  checkAnonymousLimit, recordAnonymousRefresh, rollbackAnonymousRefresh,
  checkSignedInFreeLimit, recordSignedInRefresh, rollbackSignedInRefresh,
  checkProLimit, recordProRefresh, rollbackProRefresh,
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

// GET = return the shared cached news (for signed-in users to view instantly).
// No Gemini call, no rate limit. Anonymous users get nothing (samples shown client-side).
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ articles: null })
  try {
    const stored = await getUserNews(userId)
    if (!stored || !stored.articles) return NextResponse.json({ articles: null })
    return NextResponse.json({ articles: stored.articles, fetchedAt: stored.fetched_at })
  } catch (e) {
    console.error('getUserNews error:', e)
    return NextResponse.json({ articles: null })
  }
}

// POST = trigger a fresh fetch (rate-limited per user), update the shared cache.
export async function POST(req) {
  const { userId } = await auth()
  const ip = getClientIp(req)

  let userIsPro = false

  // ---- Limit checks ----
  if (!userId) {
    const limit = await checkAnonymousLimit(ip)
    if (!limit.allowed) {
      return NextResponse.json({
        error: `This network already used its free weekly refresh. Sign up free for your own quota. Try again in ${limit.hoursUntilNextRefresh} hours.`,
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
          error: `Free weekly refresh used. Upgrade to Pro for refreshes every 4 hours. Try again in ${limit.hoursUntilNextRefresh} hours.`,
          isLimit: true,
        }, { status: 429 })
      }
    } else {
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

  // ---- Record BEFORE the Gemini call (prevents rapid-click abuse) ----
  let rollbackInfo = null
  let rollbackType = null
  try {
    if (!userId) { rollbackInfo = await recordAnonymousRefresh(ip); rollbackType = 'anonymous' }
    else if (!userIsPro) { rollbackInfo = await recordSignedInRefresh(userId); rollbackType = 'free' }
    else { rollbackInfo = await recordProRefresh(userId); rollbackType = 'pro' }
  } catch (dbErr) {
    console.error('Failed to record refresh:', dbErr)
    return NextResponse.json({ error: 'Database error tracking refresh' }, { status: 500 })
  }

  const rollback = async () => {
    try {
      if (rollbackType === 'anonymous') await rollbackAnonymousRefresh(ip, rollbackInfo)
      else if (rollbackType === 'free') await rollbackSignedInRefresh(userId, rollbackInfo)
      else if (rollbackType === 'pro') await rollbackProRefresh(userId, rollbackInfo)
    } catch (e) { console.error('Rollback failed:', e) }
  }

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  try {
    const yesterday = new Date(Date.now() - 24*60*60*1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const twoDaysAgo = new Date(Date.now() - 48*60*60*1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    const prompt = `You are a cybersecurity analyst. Today is ${today}. Yesterday was ${yesterday}.

Use Google Search to find the 8 most important cybersecurity news stories published BETWEEN ${twoDaysAgo} AND ${today}.

CRITICAL: Only include stories published in the last 48 hours. Reject any stories older than ${twoDaysAgo}. If the source article is from before ${twoDaysAgo}, do not include it.

Return ONLY a valid JSON array — no markdown, no backticks, no explanation before or after.

Each object must have exactly these fields:
- title: string (the news headline)
- tldr: string (1-2 sentences, max 40 words)
- summary: string (3-5 sentences)
- severity: one of "critical" | "high" | "medium" | "low" | "info"
- category: one of "Vulnerabilities" | "Data Breaches" | "Malware" | "Nation-State" | "Zero-Day"
- source: string (e.g. "The Hacker News", "BleepingComputer", "SecurityWeek")
- url: string (the FULL DIRECT URL to the original article. Only include if you found a real URL from your search results. Otherwise OMIT this field entirely. Never invent URLs.)
- date: string (e.g. "Apr 27")

Your entire response must be a raw JSON array starting with [ and ending with ]. Nothing else.`

    const result = await generateWithRetry(prompt)
    const text = result.text

    const match = text.match(/\[[\s\S]*\]/)
    if (!match) {
      await rollback()
      return NextResponse.json({ error: 'Could not load news right now — please try again. Your refresh was not used.' }, { status: 500 })
    }

    const articles = JSON.parse(match[0])

    // Save this user's news so they see it again on any device until they refresh
    if (userId) {
      try { await setUserNews(userId, articles) } catch (e) { console.error('setUserNews failed:', e) }
    }

    return NextResponse.json({ articles })
  } catch (err) {
    await rollback()
    console.error('CyberBrief API error:', err)
    const is429 = err.message?.includes('429') || err.message?.includes('Too Many Requests')
    if (is429) {
      return NextResponse.json(
        { error: 'Service is busy — please wait 30 seconds and try again. Your refresh was not used.' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: (err.message || 'Unknown error') + ' — your refresh was not used.' }, { status: 500 })
  }
}
