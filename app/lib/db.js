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
  await sql`
    CREATE TABLE IF NOT EXISTS anonymous_refreshes (
      id SERIAL PRIMARY KEY,
      ip_address TEXT UNIQUE NOT NULL,
      last_refresh_at TIMESTAMP DEFAULT NOW(),
      refresh_count INT DEFAULT 1
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS user_refreshes (
      id SERIAL PRIMARY KEY,
      clerk_user_id TEXT UNIQUE NOT NULL,
      last_refresh_at TIMESTAMP DEFAULT NOW(),
      refresh_count INT DEFAULT 1
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS pro_refreshes (
      id SERIAL PRIMARY KEY,
      clerk_user_id TEXT UNIQUE NOT NULL,
      last_refresh_at TIMESTAMP DEFAULT NOW(),
      refresh_count INT DEFAULT 1
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS user_news (
      clerk_user_id TEXT PRIMARY KEY,
      articles JSONB,
      fetched_at TIMESTAMP DEFAULT NOW()
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

// Re-affirm/restore Pro when a subscription recovers (e.g. after a failed payment is fixed)
export async function setUserProBySubscription(stripeSubscriptionId) {
  const rows = await sql`
    UPDATE users
    SET is_pro = TRUE, updated_at = NOW()
    WHERE stripe_subscription_id = ${stripeSubscriptionId}
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

/* ---------- PER-USER NEWS ---------- */
export async function getUserNews(clerkUserId) {
  const rows = await sql`SELECT articles, fetched_at FROM user_news WHERE clerk_user_id = ${clerkUserId}`
  return rows[0] || null
}

export async function setUserNews(clerkUserId, articles) {
  await sql`
    INSERT INTO user_news (clerk_user_id, articles, fetched_at)
    VALUES (${clerkUserId}, ${JSON.stringify(articles)}::jsonb, NOW())
    ON CONFLICT (clerk_user_id) DO UPDATE
    SET articles = ${JSON.stringify(articles)}::jsonb, fetched_at = NOW()
  `
}

/* ---------- ANONYMOUS (IP-based) ---------- */
export async function checkAnonymousLimit(ipAddress) {
  const FREE_HOURS = 168
  const rows = await sql`SELECT * FROM anonymous_refreshes WHERE ip_address = ${ipAddress}`
  if (rows.length === 0) return { allowed: true, hoursUntilNextRefresh: 0 }
  const lastRefresh = new Date(rows[0].last_refresh_at)
  const hoursSince = (Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60)
  if (hoursSince >= FREE_HOURS) return { allowed: true, hoursUntilNextRefresh: 0 }
  return { allowed: false, hoursUntilNextRefresh: Math.ceil(FREE_HOURS - hoursSince) }
}

export async function recordAnonymousRefresh(ipAddress) {
  const existing = await sql`SELECT last_refresh_at FROM anonymous_refreshes WHERE ip_address = ${ipAddress}`
  const wasNew = existing.length === 0
  const previousTimestamp = wasNew ? null : existing[0].last_refresh_at
  await sql`
    INSERT INTO anonymous_refreshes (ip_address, last_refresh_at, refresh_count)
    VALUES (${ipAddress}, NOW(), 1)
    ON CONFLICT (ip_address) DO UPDATE
    SET last_refresh_at = NOW(), refresh_count = anonymous_refreshes.refresh_count + 1
  `
  return { wasNew, previousTimestamp }
}

export async function rollbackAnonymousRefresh(ipAddress, rollback) {
  if (!rollback) return
  if (rollback.wasNew) {
    await sql`DELETE FROM anonymous_refreshes WHERE ip_address = ${ipAddress}`
  } else {
    await sql`
      UPDATE anonymous_refreshes
      SET last_refresh_at = ${rollback.previousTimestamp},
          refresh_count = GREATEST(0, refresh_count - 1)
      WHERE ip_address = ${ipAddress}
    `
  }
}

/* ---------- SIGNED-IN FREE ---------- */
export async function checkSignedInFreeLimit(clerkUserId) {
  const FREE_HOURS = 168
  const rows = await sql`SELECT * FROM user_refreshes WHERE clerk_user_id = ${clerkUserId}`
  if (rows.length === 0) return { allowed: true, hoursUntilNextRefresh: 0 }
  const lastRefresh = new Date(rows[0].last_refresh_at)
  const hoursSince = (Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60)
  if (hoursSince >= FREE_HOURS) return { allowed: true, hoursUntilNextRefresh: 0 }
  return { allowed: false, hoursUntilNextRefresh: Math.ceil(FREE_HOURS - hoursSince) }
}

export async function recordSignedInRefresh(clerkUserId) {
  const existing = await sql`SELECT last_refresh_at FROM user_refreshes WHERE clerk_user_id = ${clerkUserId}`
  const wasNew = existing.length === 0
  const previousTimestamp = wasNew ? null : existing[0].last_refresh_at
  await sql`
    INSERT INTO user_refreshes (clerk_user_id, last_refresh_at, refresh_count)
    VALUES (${clerkUserId}, NOW(), 1)
    ON CONFLICT (clerk_user_id) DO UPDATE
    SET last_refresh_at = NOW(), refresh_count = user_refreshes.refresh_count + 1
  `
  return { wasNew, previousTimestamp }
}

export async function rollbackSignedInRefresh(clerkUserId, rollback) {
  if (!rollback) return
  if (rollback.wasNew) {
    await sql`DELETE FROM user_refreshes WHERE clerk_user_id = ${clerkUserId}`
  } else {
    await sql`
      UPDATE user_refreshes
      SET last_refresh_at = ${rollback.previousTimestamp},
          refresh_count = GREATEST(0, refresh_count - 1)
      WHERE clerk_user_id = ${clerkUserId}
    `
  }
}

/* ---------- PRO (4-hour cooldown) ---------- */
export async function checkProLimit(clerkUserId) {
  const PRO_HOURS = 4
  const rows = await sql`SELECT * FROM pro_refreshes WHERE clerk_user_id = ${clerkUserId}`
  if (rows.length === 0) return { allowed: true, minutesUntilNextRefresh: 0 }
  const lastRefresh = new Date(rows[0].last_refresh_at)
  const hoursSince = (Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60)
  if (hoursSince >= PRO_HOURS) return { allowed: true, minutesUntilNextRefresh: 0 }
  return { allowed: false, minutesUntilNextRefresh: Math.ceil((PRO_HOURS - hoursSince) * 60) }
}

export async function recordProRefresh(clerkUserId) {
  const existing = await sql`SELECT last_refresh_at FROM pro_refreshes WHERE clerk_user_id = ${clerkUserId}`
  const wasNew = existing.length === 0
  const previousTimestamp = wasNew ? null : existing[0].last_refresh_at
  await sql`
    INSERT INTO pro_refreshes (clerk_user_id, last_refresh_at, refresh_count)
    VALUES (${clerkUserId}, NOW(), 1)
    ON CONFLICT (clerk_user_id) DO UPDATE
    SET last_refresh_at = NOW(), refresh_count = pro_refreshes.refresh_count + 1
  `
  return { wasNew, previousTimestamp }
}

export async function rollbackProRefresh(clerkUserId, rollback) {
  if (!rollback) return
  if (rollback.wasNew) {
    await sql`DELETE FROM pro_refreshes WHERE clerk_user_id = ${clerkUserId}`
  } else {
    await sql`
      UPDATE pro_refreshes
      SET last_refresh_at = ${rollback.previousTimestamp},
          refresh_count = GREATEST(0, refresh_count - 1)
      WHERE clerk_user_id = ${clerkUserId}
    `
  }
}
