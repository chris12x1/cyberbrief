import Stripe from 'stripe'
import { auth } from '@clerk/nextjs/server'
import { getUser } from '../../lib/db'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const user = await getUser(userId)
  if (!user?.stripe_customer_id) {
    return NextResponse.json({ error: 'No active subscription found for this account.' }, { status: 400 })
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe portal error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
