// app/api/institutions/route.ts
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'
import { institutionSchema } from '@/lib/validations'
import { InstitutionType } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const county = searchParams.get('county')
  const search = searchParams.get('search')

  const institutions = await db.institution.findMany({
    where: {
      isActive: true,
      ...(type && { type: type as InstitutionType }),
      ...(county && { county: { contains: county, mode: 'insensitive' as const } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { county: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    },
    orderBy: { name: 'asc' },
  })

  return apiSuccess({ institutions })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return apiError(error || 'Forbidden', 403)

  const body = await req.json()
  const result = institutionSchema.safeParse(body)
  if (!result.success) {
    return apiError(Object.values(result.error.flatten().fieldErrors)[0]?.[0] || 'Validation failed')
  }

  const institution = await db.institution.create({ data: result.data })
  return apiSuccess({ institution }, 201)
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return apiError(error || 'Forbidden', 403)

  const body = await req.json()
  const { id, ...data } = body

  const institution = await db.institution.update({ where: { id }, data })
  return apiSuccess({ institution })
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return apiError(error || 'Forbidden', 403)

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return apiError('Institution ID required')

  await db.institution.update({ where: { id }, data: { isActive: false } })
  return apiSuccess({ message: 'Institution deactivated' })
}
