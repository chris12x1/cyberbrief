import Stripe from 'stripe'
import { setUserPro, setUserNotPro } from '../../lib/db'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(req) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook error:', err.message)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    const customerId = session.customer
    const subscriptionId = session.subscription
    if (userId) {
      await setUserPro(userId, customerId, subscriptionId)
      console.log(`✅ Pro activated for user: ${userId}`)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    await setUserNotPro(subscription.id)
    console.log(`❌ Pro removed for subscription: ${subscription.id}`)
  }

  return NextResponse.json({ received: true })
}
