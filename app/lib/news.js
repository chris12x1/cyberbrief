import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

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

// Fetches the latest cybersecurity news from Gemini. Throws 'NO_JSON' if the
// model doesn't return a parseable array. Used by both the Pro refresh and the weekly cron.
export async function fetchLatestNews() {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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
  if (!match) throw new Error('NO_JSON')
  return JSON.parse(match[0])
}
