import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

async function generateWithRetry(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
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

export async function POST() {
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
        { error: 'No JSON array in model response. Preview: ' + text.slice(0, 300) },
        { status: 500 }
      )
    }

    const articles = JSON.parse(match[0])
    return NextResponse.json({ articles })
  } catch (err) {
    console.error('CyberBrief API error:', err)
    const is429 = err.message?.includes('429') || err.message?.includes('Too Many Requests')
    if (is429) {
      return NextResponse.json(
        { error: 'Rate limit hit — please wait 30 seconds and try again.' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
