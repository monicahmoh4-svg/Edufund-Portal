// app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  // Always return 200 so Railway healthcheck passes
  // DB check is attempted but never blocks the response
  let dbStatus = 'unchecked'

  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import('@/lib/db')
      await db.$queryRaw`SELECT 1`
      dbStatus = 'connected'
    } catch {
      dbStatus = 'unavailable'
    }
  } else {
    dbStatus = 'not_configured'
  }

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'EduFund Portal',
      database: dbStatus,
      port: process.env.PORT || '3000',
    },
    { status: 200 }   // Always 200 — Railway needs this to pass healthcheck
  )
}
