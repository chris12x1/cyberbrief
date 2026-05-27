import { auth } from '@clerk/nextjs/server'
import { getUser, checkProLimit, checkSignedInFreeLimit, checkAnonymousLimit } from '../../lib/db'
import { NextResponse } from 'next/server'

function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

export async function GET(req) {
  const { userId } = await auth()

  if (!userId) {
    // Anonymous visitor — check IP limit
    const ip = getClientIp(req)
    try {
      const limit = await checkAnonymousLimit(ip)
      return NextResponse.json({
        allowed: limit.allowed,
        cooldownMinutes: (limit.hoursUntilNextRefresh || 0) * 60,
        tier: 'anonymous',
      })
    } catch (err) {
      return NextResponse.json({ allowed: true, cooldownMinutes: 0, tier: 'anonymous' })
    }
  }

  try {
    const user = await getUser(userId)
    if (user?.is_pro) {
      const limit = await checkProLimit(userId)
      return NextResponse.json({
        allowed: limit.allowed,
        cooldownMinutes: limit.minutesUntilNextRefresh || 0,
        tier: 'pro',
      })
    } else {
      const limit = await checkSignedInFreeLimit(userId)
      return NextResponse.json({
        allowed: limit.allowed,
        cooldownMinutes: (limit.hoursUntilNextRefresh || 0) * 60,
        tier: 'free',
      })
    }
  } catch (err) {
    return NextResponse.json({ allowed: true, cooldownMinutes: 0 })
  }
}
