import { NextResponse } from 'next/server'
import { fetchLatestNews } from '../../../lib/news'
import { setSharedNews } from '../../../lib/db'

export const dynamic = 'force-dynamic'

// Weekly job (Vercel Cron) — builds the free-tier "week in cybersecurity" digest.
export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const articles = await fetchLatestNews({ days: 7, count: 10 })
    await setSharedNews(articles)
    console.log(`✅ Weekly shared digest refreshed (${articles.length} stories)`)
    return NextResponse.json({ ok: true, count: articles.length })
  } catch (err) {
    console.error('Cron refresh failed:', err)
    return NextResponse.json({ error: err.message || 'Cron failed' }, { status: 500 })
  }
}
