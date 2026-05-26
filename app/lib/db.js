import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export async function setupDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      clerk_user_id TEXT UNIQUE NOT NULL,
      email TEXT,
      is_pro BOOLEAN DEFAULT FALSE,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
}

export async function getUser(clerkUserId) {
  const rows = await sql`
    SELECT * FROM users WHERE clerk_user_id = ${clerkUserId}
  `
  return rows[0] || null
}

export async function upsertUser(clerkUserId, email) {
  const rows = await sql`
    INSERT INTO users (clerk_user_id, email)
    VALUES (${clerkUserId}, ${email})
    ON CONFLICT (clerk_user_id) DO UPDATE
    SET email = ${email}, updated_at = NOW()
    RETURNING *
  `
  return rows[0]
}

export async function setUserPro(clerkUserId, stripeCustomerId, stripeSubscriptionId) {
  const rows = await sql`
    UPDATE users
    SET is_pro = TRUE,
        stripe_customer_id = ${stripeCustomerId},
        stripe_subscription_id = ${stripeSubscriptionId},
        updated_at = NOW()
    WHERE clerk_user_id = ${clerkUserId}
    RETURNING *
  `
  return rows[0]
}

export async function setUserNotPro(stripeSubscriptionId) {
  const rows = await sql`
    UPDATE users
    SET is_pro = FALSE, updated_at = NOW()
    WHERE stripe_subscription_id = ${stripeSubscriptionId}
    RETURNING *
  `
  return rows[0]
}
