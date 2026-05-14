// app/api/auth/password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { currentPassword, newPassword, confirmPassword } = body

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { success: false, error: 'All fields are required' },
      { status: 400 }
    )
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { success: false, error: 'Passwords do not match' },
      { status: 400 }
    )
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { success: false, error: 'Password must be at least 8 characters' },
      { status: 400 }
    )
  }

  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  })

  if (!fullUser) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  const valid = await bcrypt.compare(currentPassword, fullUser.password)
  if (!valid) {
    return NextResponse.json(
      { success: false, error: 'Current password is incorrect' },
      { status: 401 }
    )
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await db.user.update({ where: { id: user.id }, data: { password: hashed } })

  return NextResponse.json({ success: true, data: { message: 'Password updated successfully' } })
}
