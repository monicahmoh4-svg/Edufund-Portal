// app/api/payments/callback/route.ts
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseCallbackData } from '@/lib/mpesa'
import { sendPaymentConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('📲 M-Pesa Callback received:', JSON.stringify(body, null, 2))

    const callbackData = body?.Body?.stkCallback
    if (!callbackData) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    const parsed = parseCallbackData(callbackData)

    // Find payment by checkout request ID — single application include with nested user
    const payment = await db.payment.findFirst({
      where: { checkoutRequestId: parsed.checkoutRequestId },
      include: {
        application: {
          select: {
            id: true,
            referenceNo: true,
            userId: true,
            user: { select: { email: true, fullName: true } },
          },
        },
      },
    })

    if (!payment) {
      console.error('Payment not found for checkout:', parsed.checkoutRequestId)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    if (parsed.resultCode === 0) {
      // Payment successful
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          mpesaReceiptNo: parsed.mpesaReceiptNo,
          transactionDate: parsed.transactionDate
            ? new Date(String(parsed.transactionDate))
            : new Date(),
          resultCode: String(parsed.resultCode),
          resultDesc: parsed.resultDesc,
        },
      })

      // Auto-submit the application
      await db.application.update({
        where: { id: payment.applicationId },
        data: { status: 'SUBMITTED' },
      })

      // Create status log
      await db.statusLog.create({
        data: {
          applicationId: payment.applicationId,
          status: 'SUBMITTED',
          changedBy: payment.userId,
          comment: `Auto-submitted after successful payment (${parsed.mpesaReceiptNo})`,
        },
      })

      // In-app notification
      await db.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Successful!',
          message: `Payment of KES ${parsed.amount} confirmed. Receipt: ${parsed.mpesaReceiptNo}. Your application has been submitted.`,
          type: 'success',
        },
      })

      // Send confirmation email (non-blocking)
      sendPaymentConfirmationEmail(
        payment.application.user.email,
        payment.application.user.fullName,
        parsed.amount || 500,
        parsed.mpesaReceiptNo || 'N/A',
        payment.application.referenceNo
      ).catch(console.error)
    } else {
      // Payment failed or cancelled
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: parsed.resultCode === 1032 ? 'CANCELLED' : 'FAILED',
          resultCode: String(parsed.resultCode),
          resultDesc: parsed.resultDesc,
        },
      })

      await db.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Failed',
          message: `Payment failed: ${parsed.resultDesc}. Please try again.`,
          type: 'error',
        },
      })
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error) {
    console.error('Callback error:', error)
    // Always return 200 to M-Pesa to prevent retries
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}
