// app/api/bursaries/route.ts
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET() {
  const bursaries = await db.bursary.findMany({
    orderBy: [
      { isOpen: 'desc' as const },
      { deadline: 'asc' as const },
    ],
  })
  return apiSuccess({ bursaries })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return apiError(error || 'Forbidden', 403)

  const body = await req.json()
  const bursary = await db.bursary.create({
    data: {
      title: String(body.title),
      description: String(body.description),
      amount: Number(body.amount),
      deadline: new Date(body.deadline),
      isOpen: body.isOpen !== false,
      eligibility: body.eligibility ? String(body.eligibility) : null,
      provider: String(body.provider),
    },
  })
  return apiSuccess({ bursary }, 201)
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return apiError(error || 'Forbidden', 403)

  const body = await req.json()
  const { id, ...rest } = body

  const data: {
    title?: string
    description?: string
    amount?: number
    deadline?: Date
    isOpen?: boolean
    eligibility?: string | null
    provider?: string
  } = {}

  if (rest.title !== undefined) data.title = String(rest.title)
  if (rest.description !== undefined) data.description = String(rest.description)
  if (rest.amount !== undefined) data.amount = Number(rest.amount)
  if (rest.deadline !== undefined) data.deadline = new Date(rest.deadline)
  if (rest.isOpen !== undefined) data.isOpen = Boolean(rest.isOpen)
  if (rest.eligibility !== undefined) data.eligibility = rest.eligibility ? String(rest.eligibility) : null
  if (rest.provider !== undefined) data.provider = String(rest.provider)

  const bursary = await db.bursary.update({ where: { id }, data })
  return apiSuccess({ bursary })
}
