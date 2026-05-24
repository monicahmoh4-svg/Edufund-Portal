// lib/mpesa.ts — Lipana.dev M-Pesa STK Push Integration
// Docs: https://lipana.dev/docs
// SDK:  https://www.npmjs.com/package/@lipana/sdk

import { Lipana, LipanaError } from '@lipana/sdk'

function getLipanaClient() {
  const apiKey = process.env.LIPANA_SECRET_KEY
  const environment = (process.env.LIPANA_ENVIRONMENT || 'sandbox') as 'production' | 'sandbox'

  if (!apiKey || apiKey === 'your-lipana-secret-key') {
    return null // mock mode
  }

  return new Lipana({ apiKey, environment })
}

export interface StkPushResult {
  success: boolean
  transactionId?: string
  checkoutRequestId?: string
  message: string
  isMock: boolean
}

export async function initiateSTKPush(
  phone: string,
  amount: number
): Promise<StkPushResult> {
  const lipana = getLipanaClient()

  // MOCK MODE — no real credentials set
  if (!lipana) {
    console.log('🔧 Lipana MOCK mode — STK push simulated for:', phone, 'amount:', amount)
    return {
      success: true,
      transactionId: `MOCK-TXN-${Date.now()}`,
      checkoutRequestId: `MOCK-CR-${Date.now()}`,
      message: 'Mock STK push initiated. Use Confirm Mock Payment button.',
      isMock: true,
    }
  }

  try {
    // Format phone: must be +254XXXXXXXXX
    const formattedPhone = formatPhone(phone)

    const response = await lipana.transactions.initiateStkPush({
      phone: formattedPhone,
      amount: Math.ceil(amount),
    })

    console.log('✅ Lipana STK Push initiated:', response)

    return {
      success: true,
      transactionId: (response as { id?: string }).id,
      checkoutRequestId: (response as { checkoutRequestId?: string }).checkoutRequestId,
      message: `M-Pesa payment prompt sent to ${formattedPhone}. Enter your PIN to confirm.`,
      isMock: false,
    }
  } catch (error) {
    if (error instanceof LipanaError) {
      console.error('Lipana STK error:', error.message)
      throw new Error(`M-Pesa error: ${error.message}`)
    }
    throw error
  }
}

export function verifyWebhookSignature(
  body: unknown,
  signature: string,
  secret: string
): boolean {
  try {
    const lipana = getLipanaClient()
    if (!lipana) return true // skip verification in mock mode
    return lipana.webhooks.verify(body, signature, secret)
  } catch {
    return false
  }
}

export function parseWebhookPayload(body: {
  type?: string
  data?: {
    id?: string
    status?: string
    amount?: number
    phone?: string
    mpesaReceiptNumber?: string
    checkoutRequestId?: string
    resultCode?: number
    resultDesc?: string
  }
}) {
  const data = body?.data || {}
  const isSuccess = data.status === 'success' || data.resultCode === 0

  return {
    isSuccess,
    isFailed: data.status === 'failed' || (data.resultCode !== undefined && data.resultCode !== 0),
    isCancelled: data.resultCode === 1032,
    transactionId: data.id,
    mpesaReceiptNo: data.mpesaReceiptNumber,
    amount: data.amount,
    phone: data.phone,
    checkoutRequestId: data.checkoutRequestId,
    resultCode: data.resultCode,
    resultDesc: data.resultDesc,
  }
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) return `+254${cleaned.substring(1)}`
  if (cleaned.startsWith('254')) return `+${cleaned}`
  if (cleaned.startsWith('+254')) return cleaned
  return `+254${cleaned}`
}
