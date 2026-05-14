// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, email, phone, password, confirmPassword } = body

    // Basic validation
    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Dynamic imports — avoids bundling issues in standalone Docker build
    const { db } = await import('@/lib/db')
    const bcrypt = await import('bcryptjs')
    const jwt = await import('jsonwebtoken')

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already registered. Please login instead.' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        role: 'STUDENT',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
    })

    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
    const token = jwt.default.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    )

    // Send welcome email (non-blocking, ignore errors)
    try {
      const { sendWelcomeEmail } = await import('@/lib/email')
      sendWelcomeEmail(user.email, user.fullName).catch(() => {})
    } catch {
      // email failure must never break registration
    }

    const response = NextResponse.json(
      { success: true, data: { user, token } },
      { status: 201 }
    )

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
