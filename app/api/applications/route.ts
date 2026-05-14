// app/api/applications/route.ts
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { apiError, apiSuccess, generateReferenceNo } from '@/lib/utils'
import { sendApplicationStatusEmail } from '@/lib/email'
import { ApplicationStatus, Gender, InstitutionType, Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error || !user) return apiError(error || 'Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const skip = (page - 1) * limit

  const where: Prisma.ApplicationWhereInput =
    user.role === 'ADMIN' ? {} : { userId: user.id }

  const [applications, total] = await Promise.all([
    db.application.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        payment: { select: { status: true, mpesaReceiptNo: true, amount: true } },
        documents: { select: { id: true, documentType: true, fileName: true } },
        statusLogs: { orderBy: { createdAt: 'desc' as const }, take: 5 },
      },
      orderBy: { createdAt: 'desc' as const },
      skip,
      take: limit,
    }),
    db.application.count({ where }),
  ])

  return apiSuccess({ applications, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error || !user) return apiError(error || 'Unauthorized', 401)

  try {
    const body = await req.json()

    const existing = await db.application.findFirst({
      where: {
        userId: user.id,
        status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] },
      },
    })

    if (existing) {
      return apiError('You already have an active application. Complete or withdraw it first.', 409)
    }

    const referenceNo = generateReferenceNo()

    const application = await db.application.create({
      data: {
        userId: user.id,
        referenceNo,
        status: 'DRAFT' as ApplicationStatus,
        fullName: String(body.fullName),
        idNumber: String(body.idNumber),
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender as Gender,
        phone: String(body.phone),
        email: String(body.email),
        county: String(body.county),
        constituency: body.constituency ? String(body.constituency) : null,
        hasDisability: Boolean(body.hasDisability),
        disabilityNotes: body.disabilityNotes ? String(body.disabilityNotes) : null,
        guardianName: String(body.guardianName),
        guardianOccupation: String(body.guardianOccupation),
        householdIncome: Number(body.householdIncome),
        dependents: Number(body.dependents),
        isOrphan: Boolean(body.isOrphan),
        orphanStatus: body.orphanStatus ? String(body.orphanStatus) : null,
        institutionType: body.institutionType as InstitutionType,
        institutionName: String(body.institutionName),
        institutionId: body.institutionId ? String(body.institutionId) : null,
        admissionNumber: String(body.admissionNumber),
        course: String(body.course),
        yearOfStudy: Number(body.yearOfStudy),
        totalFees: body.totalFees ? Number(body.totalFees) : null,
        feesRequired: Number(body.feesRequired),
        amountRequested: Number(body.amountRequested),
        otherFunding: Number(body.otherFunding || 0),
        otherFundingSource: body.otherFundingSource ? String(body.otherFundingSource) : null,
        personalStatement: String(body.personalStatement),
      },
    })

    return apiSuccess({ application, referenceNo }, 201)
  } catch (err) {
    console.error('Application create error:', err)
    return apiError('Failed to create application', 500)
  }
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error || !user) return apiError(error || 'Unauthorized', 401)

  try {
    const body = await req.json()
    const { applicationId, status } = body

    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: { user: { select: { email: true, fullName: true } } },
    })

    if (!application) return apiError('Application not found', 404)
    if (application.userId !== user.id && user.role !== 'ADMIN') {
      return apiError('Forbidden', 403)
    }
    if (!['DRAFT'].includes(application.status) && user.role !== 'ADMIN') {
      return apiError('Cannot edit a submitted application', 400)
    }

    const updated = await db.application.update({
      where: { id: applicationId },
      data: { status: status as ApplicationStatus },
    })

    if (status === 'SUBMITTED' && application.status !== 'SUBMITTED') {
      await db.statusLog.create({
        data: {
          applicationId,
          status: 'SUBMITTED' as ApplicationStatus,
          changedBy: user.id,
          comment: 'Application submitted by student',
        },
      })
      await db.notification.create({
        data: {
          userId: application.userId,
          title: 'Application Submitted',
          message: `Your application ${application.referenceNo} has been submitted successfully.`,
          type: 'success',
        },
      })
      sendApplicationStatusEmail(
        application.user.email,
        application.user.fullName,
        application.referenceNo,
        'SUBMITTED'
      ).catch(console.error)
    }

    return apiSuccess(updated)
  } catch (err) {
    console.error('Application update error:', err)
    return apiError('Failed to update application', 500)
  }
}
