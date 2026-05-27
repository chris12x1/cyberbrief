import { auth } from '@clerk/nextjs/server'
import { getUser, checkProLimit, checkSignedInFreeLimit } from '../../lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ allowed: true, cooldownMinutes: 0 })
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
