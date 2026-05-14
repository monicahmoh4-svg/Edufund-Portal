// app/api/payments/initiate/route.ts
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'
import { initiateSTKPush } from '@/lib/mpesa'
import { paymentSchema } from '@/lib/validations'

const APPLICATION_FEE = parseFloat(process.env.APPLICATION_FEE || '500')

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error || !user) return apiError(error || 'Unauthorized', 401)

  try {
    const body = await req.json()

    const result = paymentSchema.safeParse(body)
    if (!result.success) {
      return apiError(
        result.error.flatten().fieldErrors.phone?.[0] || 'Invalid phone number'
      )
    }

    const { phone, applicationId } = result.data

    const application = await db.application.findUnique({
      where: { id: applicationId },
      select: { id: true, userId: true, referenceNo: true, status: true },
    })

    if (!application) return apiError('Application not found', 404)
    if (application.userId !== user.id) return apiError('Forbidden', 403)

    const existingPayment = await db.payment.findUnique({ where: { applicationId } })
    if (existingPayment?.status === 'SUCCESS') {
      return apiError('This application already has a successful payment', 409)
    }

    const stkResponse = await initiateSTKPush(
      phone,
      APPLICATION_FEE,
      application.referenceNo,
      'EduFund Application Fee'
    )

    if (stkResponse.ResponseCode !== '0') {
      return apiError(`M-Pesa error: ${stkResponse.ResponseDescription}`)
    }

    const isMock =
      !process.env.MPESA_CONSUMER_KEY ||
      process.env.MPESA_CONSUMER_KEY === 'your-mpesa-consumer-key'

    const payment = await db.payment.upsert({
      where: { applicationId },
      create: {
        applicationId,
        userId: user.id,
        amount: APPLICATION_FEE,
        phone,
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status: 'PENDING',
      },
      update: {
        phone,
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status: 'PENDING',
        resultCode: null,
        resultDesc: null,
      },
    })

    return apiSuccess({
      payment: {
        id: payment.id,
        status: payment.status,
        checkoutRequestId: payment.checkoutRequestId,
      },
      message: `An M-Pesa prompt has been sent to ${phone}. Enter your PIN to complete.`,
      isMock,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment initiation failed'
    return apiError(message, 500)
  }
}
