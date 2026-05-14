// app/api/admin/stats/route.ts
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return apiError(error || 'Forbidden', 403)

  const [
    totalApplications,
    submittedApplications,
    underReviewApplications,
    approvedApplications,
    rejectedApplications,
    disbursedApplications,
    totalUsers,
    totalInstitutions,
    totalRevenue,
    recentApplications,
    applicationsByStatus,
    applicationsByInstitutionType,
    recentPayments,
  ] = await Promise.all([
    db.application.count(),
    db.application.count({ where: { status: 'SUBMITTED' } }),
    db.application.count({ where: { status: 'UNDER_REVIEW' } }),
    db.application.count({ where: { status: 'APPROVED' } }),
    db.application.count({ where: { status: 'REJECTED' } }),
    db.application.count({ where: { status: 'DISBURSED' } }),
    db.user.count({ where: { role: 'STUDENT' } }),
    db.institution.count({ where: { isActive: true } }),
    db.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    }),
    db.application.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' as const },
      include: {
        user: { select: { fullName: true, email: true } },
        payment: { select: { status: true } },
      },
    }),
    db.application.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    db.application.groupBy({
      by: ['institutionType'],
      _count: { institutionType: true },
    }),
    db.payment.findMany({
      take: 5,
      where: { status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' as const },
      include: {
        application: { select: { referenceNo: true } },
      },
    }),
  ])

  return apiSuccess({
    summary: {
      total: totalApplications,
      submitted: submittedApplications,
      underReview: underReviewApplications,
      approved: approvedApplications,
      rejected: rejectedApplications,
      disbursed: disbursedApplications,
      totalUsers,
      totalInstitutions,
      totalRevenue: totalRevenue._sum.amount || 0,
    },
    recentApplications,
    applicationsByStatus,
    applicationsByInstitutionType,
    recentPayments,
  })
}
