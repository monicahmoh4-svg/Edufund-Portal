// app/api/payments/initiate/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { initiateSTKPush } from '@/lib/mpesa'

const APPLICATION_FEE = parseFloat(process.env.APPLICATION_FEE || '500')

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { phone, applicationId } = body

    if (!phone || !applicationId) {
      return NextResponse.json(
        { success: false, error: 'Phone number and application ID are required' },
        { status: 400 }
      )
    }

    // Verify application belongs to user
    const application = await db.application.findUnique({
      where: { id: applicationId },
      select: { id: true, userId: true, referenceNo: true, status: true },
    })

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
    }

    if (application.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Check if already paid
    const existingPayment = await db.payment.findUnique({ where: { applicationId } })
    if (existingPayment?.status === 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: 'This application already has a successful payment' },
        { status: 409 }
      )
    }

    // Initiate STK Push via Lipana
    const result = await initiateSTKPush(phone, APPLICATION_FEE)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to initiate M-Pesa payment' },
        { status: 500 }
      )
    }

    // Create or update payment record
    const payment = await db.payment.upsert({
      where: { applicationId },
      create: {
        applicationId,
        userId: user.id,
        amount: APPLICATION_FEE,
        phone,
        checkoutRequestId: result.checkoutRequestId || result.transactionId,
        merchantRequestId: result.transactionId,
        status: 'PENDING',
      },
      update: {
        phone,
        checkoutRequestId: result.checkoutRequestId || result.transactionId,
        merchantRequestId: result.transactionId,
        status: 'PENDING',
        resultCode: null,
        resultDesc: null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          status: payment.status,
          checkoutRequestId: payment.checkoutRequestId,
        },
        message: result.message,
        isMock: result.isMock,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment initiation failed'
    console.error('Payment initiate error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
