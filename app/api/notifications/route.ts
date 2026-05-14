// app/api/notifications/route.ts
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error || !user) return apiError(error || 'Unauthorized', 401)

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' as const },
    take: 50,
  })

  return apiSuccess({ notifications })
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth(req)
  if (error || !user) return apiError(error || 'Unauthorized', 401)

  const body = await req.json()
  const { notificationId, markAllRead } = body

  if (markAllRead) {
    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    })
    return apiSuccess({ message: 'All notifications marked as read' })
  }

  if (notificationId) {
    await db.notification.update({
      where: { id: notificationId, userId: user.id },
      data: { isRead: true },
    })
    return apiSuccess({ message: 'Notification marked as read' })
  }

  return apiError('No action specified')
}
