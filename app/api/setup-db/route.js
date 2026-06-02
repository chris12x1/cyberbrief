import { setupDatabase } from '../../lib/db'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const secret = process.env.SETUP_SECRET

  // If no secret is configured, the endpoint is disabled entirely
  if (!secret) {
    return NextResponse.json(
      { error: 'Setup endpoint is disabled.' },
      { status: 403 }
    )
  }

  // Require ?secret=... to match
  const url = new URL(req.url)
  const provided = url.searchParams.get('secret')
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await setupDatabase()
    return NextResponse.json({ message: 'Database setup complete' })
  } catch (err) {
    console.error('DB setup error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
