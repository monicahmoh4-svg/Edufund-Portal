// app/api/payments/status/route.ts
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'
import { ApplicationStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error || !user) return apiError(error || 'Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const applicationId = searchParams.get('applicationId')
  if (!applicationId) return apiError('applicationId is required')

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

  return apiSuccess({ payment })
}

// Mock payment confirmation (sandbox / dev only)
export async function POST(req: NextRequest) {
  const isMock =
    !process.env.MPESA_CONSUMER_KEY ||
    process.env.MPESA_CONSUMER_KEY === 'your-mpesa-consumer-key'

  if (!isMock) {
    return apiError('Mock confirmation only available in sandbox mode', 403)
  }

  const { user, error } = await requireAuth(req)
  if (error || !user) return apiError(error || 'Unauthorized', 401)

  const body = await req.json()
  const { applicationId } = body

  const payment = await db.payment.findUnique({ where: { applicationId } })
  if (!payment) return apiError('Payment not found', 404)

  const mockReceipt = `QK${Date.now().toString().slice(-8)}`

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'SUCCESS',
      mpesaReceiptNo: mockReceipt,
      transactionDate: new Date(),
      resultCode: '0',
      resultDesc: 'The service request is processed successfully.',
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
      comment: `Submitted after mock payment (${mockReceipt})`,
    },
  })

  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Application Submitted!',
      message: `Payment confirmed (Mock: ${mockReceipt}). Your application has been submitted for review.`,
      type: 'success',
    },
  })

  return apiSuccess({
    mpesaReceiptNo: mockReceipt,
    message: 'Mock payment confirmed and application submitted!',
  })
}
