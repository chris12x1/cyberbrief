import { auth, currentUser } from '@clerk/nextjs/server'
import { upsertUser, getUser } from '../../lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ isPro: false })
  }

  try {
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || ''

    // Upsert user in DB
    await upsertUser(userId, email)

    // Get pro status
    const user = await getUser(userId)
    return NextResponse.json({ isPro: user?.is_pro || false })
  } catch (err) {
    console.error('User status error:', err)
    return NextResponse.json({ isPro: false })
  }
}
