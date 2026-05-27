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

  // Track anonymous (signed-out) users by IP
  await sql`
    CREATE TABLE IF NOT EXISTS anonymous_refreshes (
      id SERIAL PRIMARY KEY,
      ip_address TEXT UNIQUE NOT NULL,
      last_refresh_at TIMESTAMP DEFAULT NOW(),
      refresh_count INT DEFAULT 1
    )
  `

  // Track signed-in free user usage (for future per-account limits)
  await sql`
    CREATE TABLE IF NOT EXISTS user_refreshes (
      id SERIAL PRIMARY KEY,
      clerk_user_id TEXT UNIQUE NOT NULL,
      last_refresh_at TIMESTAMP DEFAULT NOW(),
      refresh_count INT DEFAULT 1
    )
  `
}

export async function getUser(clerkUserId) {
  const rows = await sql`SELECT * FROM users WHERE clerk_user_id = ${clerkUserId}`
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

// Anonymous (signed-out) IP-based limit
// Returns { allowed: boolean, hoursUntilNextRefresh: number }
export async function checkAnonymousLimit(ipAddress) {
  const FREE_HOURS = 168 // 7 days

  const rows = await sql`SELECT * FROM anonymous_refreshes WHERE ip_address = ${ipAddress}`
  if (rows.length === 0) return { allowed: true, hoursUntilNextRefresh: 0 }

  const lastRefresh = new Date(rows[0].last_refresh_at)
  const hoursSince = (Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60)

  if (hoursSince >= FREE_HOURS) return { allowed: true, hoursUntilNextRefresh: 0 }

  return { allowed: false, hoursUntilNextRefresh: Math.ceil(FREE_HOURS - hoursSince) }
}

export async function recordAnonymousRefresh(ipAddress) {
  await sql`
    INSERT INTO anonymous_refreshes (ip_address, last_refresh_at, refresh_count)
    VALUES (${ipAddress}, NOW(), 1)
    ON CONFLICT (ip_address) DO UPDATE
    SET last_refresh_at = NOW(), refresh_count = anonymous_refreshes.refresh_count + 1
  `
}

// Signed-in free user limit (also weekly)
export async function checkSignedInFreeLimit(clerkUserId) {
  const FREE_HOURS = 168 // 7 days

  const rows = await sql`SELECT * FROM user_refreshes WHERE clerk_user_id = ${clerkUserId}`
  if (rows.length === 0) return { allowed: true, hoursUntilNextRefresh: 0 }

  const lastRefresh = new Date(rows[0].last_refresh_at)
  const hoursSince = (Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60)

  if (hoursSince >= FREE_HOURS) return { allowed: true, hoursUntilNextRefresh: 0 }

  return { allowed: false, hoursUntilNextRefresh: Math.ceil(FREE_HOURS - hoursSince) }
}

export async function recordSignedInRefresh(clerkUserId) {
  await sql`
    INSERT INTO user_refreshes (clerk_user_id, last_refresh_at, refresh_count)
    VALUES (${clerkUserId}, NOW(), 1)
    ON CONFLICT (clerk_user_id) DO UPDATE
    SET last_refresh_at = NOW(), refresh_count = user_refreshes.refresh_count + 1
  `
}
