import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { fetchLatestNews } from '../../lib/news'
import {
  getUser,
  getUserNews, setUserNews,
  getSharedNews,
  checkProLimit, recordProRefresh, rollbackProRefresh,
} from '../../lib/db'

function formatTimeRemaining(minutes) {
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`
  return `${hours}h ${mins}m`
}

// GET = read news for display.
// Pro → their own personal news. Free → the weekly shared snapshot. Anonymous → nothing (samples client-side).
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ articles: null })

  try {
    const user = await getUser(userId)
    if (user?.is_pro) {
      const personal = await getUserNews(userId)
      if (personal?.articles) {
        return NextResponse.json({ articles: personal.articles, fetchedAt: personal.fetched_at })
      }
      return NextResponse.json({ articles: null }) // no personal news yet → client auto-fetches
    } else {
      const shared = await getSharedNews()
      if (shared?.articles) {
        return NextResponse.json({ articles: shared.articles, fetchedAt: shared.fetched_at })
      }
      return NextResponse.json({ articles: null })
    }
  } catch (e) {
    console.error('news GET error:', e)
    return NextResponse.json({ articles: null })
  }
}

// POST = on-demand refresh. PRO ONLY. Updates only the Pro user's personal feed.
export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  }

  const user = await getUser(userId)
  if (!user?.is_pro) {
    return NextResponse.json({
      error: 'On-demand refresh is a Pro feature. Upgrade to Pro to pull the latest threats every 4 hours.',
      proOnly: true,
    }, { status: 403 })
  }

  const limit = await checkProLimit(userId)
  if (!limit.allowed) {
    const timeStr = formatTimeRemaining(limit.minutesUntilNextRefresh)
    return NextResponse.json({
      error: `Pro refresh cooldown — please try again in ${timeStr}. News cycles update every few hours, so the data won't change much before then.`,
      isLimit: true,
    }, { status: 429 })
  }

  let rollbackInfo = null
  try {
    rollbackInfo = await recordProRefresh(userId)
  } catch (dbErr) {
    console.error('Failed to record refresh:', dbErr)
    return NextResponse.json({ error: 'Database error tracking refresh' }, { status: 500 })
  }

  try {
    const articles = await fetchLatestNews()
    try { await setUserNews(userId, articles) } catch (e) { console.error('setUserNews failed:', e) }
    return NextResponse.json({ articles })
  } catch (err) {
    try { await rollbackProRefresh(userId, rollbackInfo) } catch (e) { console.error('Rollback failed:', e) }
    console.error('CyberBrief API error:', err)
    if (err.message === 'NO_JSON') {
      return NextResponse.json({ error: 'Could not load news right now — please try again. Your refresh was not used.' }, { status: 500 })
    }
    const is429 = err.message?.includes('429') || err.message?.includes('Too Many Requests')
    if (is429) {
      return NextResponse.json({ error: 'Service is busy — please wait 30 seconds and try again. Your refresh was not used.' }, { status: 429 })
    }
    return NextResponse.json({ error: (err.message || 'Unknown error') + ' — your refresh was not used.' }, { status: 500 })
  }
}
