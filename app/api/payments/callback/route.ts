// app/api/payments/callback/route.ts
// Lipana webhook — configure this URL in your Lipana dashboard:
// https://your-app.up.railway.app/api/payments/callback
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyWebhookSignature, parseWebhookPayload } from '@/lib/mpesa'
import { sendPaymentConfirmationEmail } from '@/lib/email'
import { ApplicationStatus } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('📲 Lipana Webhook received:', JSON.stringify(body, null, 2))

    // Verify webhook signature if secret is set
    const signature = req.headers.get('x-lipana-signature') || ''
    const webhookSecret = process.env.LIPANA_WEBHOOK_SECRET || ''

    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret)
      if (!isValid) {
        console.error('❌ Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const parsed = parseWebhookPayload(body)

    // Find payment by checkoutRequestId or transactionId
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { checkoutRequestId: parsed.checkoutRequestId },
          { checkoutRequestId: parsed.transactionId },
          { merchantRequestId: parsed.transactionId },
        ],
      },
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
      console.error('Payment not found for transaction:', parsed)
      // Return 200 to prevent Lipana from retrying
      return NextResponse.json({ received: true })
    }

    if (parsed.isSuccess) {
      // Update payment to SUCCESS
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          mpesaReceiptNo: parsed.mpesaReceiptNo || parsed.transactionId,
          transactionDate: new Date(),
          resultCode: String(parsed.resultCode || 0),
          resultDesc: parsed.resultDesc || 'Success',
        },
      })

      // Submit the application
      await db.application.update({
        where: { id: payment.applicationId },
        data: { status: 'SUBMITTED' as ApplicationStatus },
      })

      await db.statusLog.create({
        data: {
          applicationId: payment.applicationId,
          status: 'SUBMITTED' as ApplicationStatus,
          changedBy: payment.userId,
          comment: `Auto-submitted after successful M-Pesa payment (${parsed.mpesaReceiptNo || parsed.transactionId})`,
        },
      })

      await db.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Successful! 🎉',
          message: `Payment of KES ${parsed.amount || payment.amount} confirmed. Receipt: ${parsed.mpesaReceiptNo || 'N/A'}. Your application has been submitted.`,
          type: 'success',
        },
      })

      sendPaymentConfirmationEmail(
        payment.application.user.email,
        payment.application.user.fullName,
        parsed.amount || payment.amount,
        parsed.mpesaReceiptNo || 'N/A',
        payment.application.referenceNo
      ).catch(console.error)

    } else if (parsed.isFailed || parsed.isCancelled) {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: parsed.isCancelled ? 'CANCELLED' : 'FAILED',
          resultCode: String(parsed.resultCode || 'N/A'),
          resultDesc: parsed.resultDesc || 'Payment failed',
        },
      })

      await db.notification.create({
        data: {
          userId: payment.userId,
          title: parsed.isCancelled ? 'Payment Cancelled' : 'Payment Failed',
          message: parsed.isCancelled
            ? 'You cancelled the M-Pesa payment. Please try again.'
            : `Payment failed: ${parsed.resultDesc || 'Unknown error'}. Please try again.`,
          type: 'error',
        },
      })
    }

    // Always return 200 to Lipana
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ received: true })
  }
}
