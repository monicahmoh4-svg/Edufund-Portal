// app/api/admin/applications/route.ts
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'
import { adminCommentSchema } from '@/lib/validations'
import { sendApplicationStatusEmail } from '@/lib/email'
import { ApplicationStatus, InstitutionType } from '@prisma/client'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return apiError(error || 'Forbidden', 403)

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') as ApplicationStatus | null
  const institutionType = searchParams.get('institutionType') as InstitutionType | null
  const search = searchParams.get('search')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const skip = (page - 1) * limit

  const where: Prisma.ApplicationWhereInput = {}
  if (status) where.status = status
  if (institutionType) where.institutionType = institutionType
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    }
  }
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
      { referenceNo: { contains: search, mode: 'insensitive' as const } },
      { institutionName: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  const [applications, total] = await Promise.all([
    db.application.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        payment: { select: { status: true, mpesaReceiptNo: true, amount: true, createdAt: true } },
        documents: { select: { id: true, documentType: true, fileName: true, filePath: true } },
        statusLogs: { orderBy: { createdAt: 'asc' as const } },
      },
      orderBy: { createdAt: 'desc' as const },
      skip,
      take: limit,
    }),
    db.application.count({ where }),
  ])

  return apiSuccess({ applications, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return apiError(error || 'Forbidden', 403)

  const body = await req.json()
  const { applicationId, ...rest } = body

  const result = adminCommentSchema.safeParse(rest)
  if (!result.success) {
    return apiError(Object.values(result.error.flatten().fieldErrors)[0]?.[0] || 'Validation failed')
  }

  const { status, comment } = result.data

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { user: { select: { email: true, fullName: true } } },
  })

  if (!application) return apiError('Application not found', 404)

  const updateData: Prisma.ApplicationUpdateInput = {
    status: status as ApplicationStatus,
    adminComment: comment,
    reviewedBy: user.id,
    reviewedAt: new Date(),
  }

  if (status === 'APPROVED') updateData.approvedAt = new Date()
  if (status === 'DISBURSED') updateData.disbursedAt = new Date()

  const updated = await db.application.update({
    where: { id: applicationId },
    data: updateData,
  })

  await db.statusLog.create({
    data: {
      applicationId,
      status: status as ApplicationStatus,
      changedBy: user.id,
      comment,
    },
  })

  await db.auditLog.create({
    data: {
      adminId: user.id,
      action: `STATUS_CHANGED_TO_${status}`,
      entity: 'Application',
      entityId: applicationId,
      details: { status, comment, previousStatus: application.status },
    },
  })

  await db.notification.create({
    data: {
      userId: application.userId,
      title: `Application ${status.replace('_', ' ')}`,
      message: comment,
      type:
        status === 'APPROVED' || status === 'DISBURSED'
          ? 'success'
          : status === 'REJECTED'
          ? 'error'
          : 'info',
    },
  })

  sendApplicationStatusEmail(
    application.user.email,
    application.user.fullName,
    application.referenceNo,
    status,
    comment
  ).catch(console.error)

  return apiSuccess(updated)
}
