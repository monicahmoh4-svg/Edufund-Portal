// app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { fullName, phone } = body

  if (!fullName && !phone) {
    return NextResponse.json(
      { success: false, error: 'Nothing to update' },
      { status: 400 }
    )
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(fullName && { fullName: String(fullName) }),
      ...(phone && { phone: String(phone) }),
    },
    select: { id: true, fullName: true, email: true, phone: true, role: true },
  })

  return NextResponse.json({ success: true, data: updated })
}
