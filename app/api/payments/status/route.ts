// app/api/payments/status/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { ApplicationStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const applicationId = searchParams.get('applicationId')

  if (!applicationId) {
    return NextResponse.json({ success: false, error: 'applicationId is required' }, { status: 400 })
  }

  const payment = await db.payment.findUnique({
    where: { applicationId },
    select: {
      id: true,
      status: true,
      mpesaReceiptNo: true,
      amount: true,
      phone: true,
      transactionDate: true,
      resultDesc: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ success: true, data: { payment } })
}

// Mock payment confirmation — only works when LIPANA_SECRET_KEY is not set
export async function POST(req: NextRequest) {
  const isMock =
    !process.env.LIPANA_SECRET_KEY ||
    process.env.LIPANA_SECRET_KEY === 'your-lipana-secret-key'

  if (!isMock) {
    return NextResponse.json(
      { success: false, error: 'Mock confirmation only available in sandbox/mock mode' },
      { status: 403 }
    )
  }

  const { user, error } = await requireAuth(req)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { applicationId } = body

  const payment = await db.payment.findUnique({ where: { applicationId } })
  if (!payment) {
    return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
  }

  const mockReceipt = `QK${Date.now().toString().slice(-8)}`

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'SUCCESS',
      mpesaReceiptNo: mockReceipt,
      transactionDate: new Date(),
      resultCode: '0',
      resultDesc: 'Mock payment confirmed successfully.',
    },
  })

  await db.application.update({
    where: { id: applicationId },
    data: { status: 'SUBMITTED' as ApplicationStatus },
  })

  await db.statusLog.create({
    data: {
      applicationId,
      status: 'SUBMITTED' as ApplicationStatus,
      changedBy: user.id,
      comment: `Submitted after mock Lipana payment (${mockReceipt})`,
    },
  })

  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Application Submitted! 🎉',
      message: `Mock payment confirmed (${mockReceipt}). Your application has been submitted for review.`,
      type: 'success',
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      mpesaReceiptNo: mockReceipt,
      message: 'Mock payment confirmed and application submitted!',
    },
  })
}
