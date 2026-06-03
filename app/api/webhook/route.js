import Stripe from 'stripe'
import { setUserPro, setUserNotPro, setUserProBySubscription } from '../../lib/db'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(req) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // New subscription paid for → activate Pro on the account that checked out
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId
        if (userId) {
          await setUserPro(userId, session.customer, session.subscription)
          console.log(`✅ Pro activated for user: ${userId}`)
        }
        break
      }

      // Subscription status changed. Covers failed renewals (past_due/unpaid),
      // recoveries (back to active), and cancellations.
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const isActive = sub.status === 'active' || sub.status === 'trialing'
        if (isActive) {
          await setUserProBySubscription(sub.id)
          console.log(`✅ Pro confirmed for subscription ${sub.id} (status: ${sub.status})`)
        } else {
          // past_due, unpaid, canceled, incomplete, incomplete_expired, paused
          await setUserNotPro(sub.id)
          console.log(`⚠️ Pro removed for subscription ${sub.id} (status: ${sub.status})`)
        }
        break
      }

      // Subscription fully ended → remove Pro
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await setUserNotPro(sub.id)
        console.log(`❌ Pro removed (subscription deleted): ${sub.id}`)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    // Return 500 so Stripe retries — these DB operations are safe to repeat
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
