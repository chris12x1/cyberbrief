import { setupDatabase } from '../../lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await setupDatabase()
    return NextResponse.json({ message: 'Database setup complete' })
  } catch (err) {
    console.error('DB setup error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
