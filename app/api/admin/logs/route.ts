// app/api/admin/logs/route.ts
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return apiError(error || 'Forbidden', 403)

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '30')
  const search = searchParams.get('search')
  const skip = (page - 1) * limit

  const where: Prisma.AuditLogWhereInput = search
    ? {
        OR: [
          { action: { contains: search, mode: 'insensitive' as const } },
          { entity: { contains: search, mode: 'insensitive' as const } },
          { admin: { fullName: { contains: search, mode: 'insensitive' as const } } },
        ],
      }
    : {}

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { admin: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' as const },
      skip,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ])

  return apiSuccess({ logs, total, page, limit })
}
