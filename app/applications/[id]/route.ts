// app/api/applications/[id]/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth(req)
  if (error || !user) return apiError(error || 'Unauthorized', 401)

  const application = await db.application.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
      payment: {
        select: { status: true, mpesaReceiptNo: true, amount: true, createdAt: true },
      },
      documents: true,
      statusLogs: { orderBy: { createdAt: 'asc' as const } },
    },
  })

  if (!application) return apiError('Application not found', 404)

  if (application.userId !== user.id && user.role !== 'ADMIN') {
    return apiError('Forbidden', 403)
  }

  return apiSuccess({ application })
}
