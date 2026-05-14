// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.substring(7)
  return req.cookies.get('auth_token')?.value || null
}

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req)
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const jwt = await import('jsonwebtoken')
    const { db } = await import('@/lib/db')

    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
    let payload: { userId: string; email: string; role: string }

    try {
      payload = jwt.default.verify(token, secret) as typeof payload
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const unreadNotifications = await db.notification.count({
      where: { userId: user.id, isRead: false },
    })

    return NextResponse.json({
      success: true,
      data: { ...user, unreadNotifications },
    })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    data: { message: 'Logged out successfully' },
  })
  response.cookies.delete('auth_token')
  return response
}
