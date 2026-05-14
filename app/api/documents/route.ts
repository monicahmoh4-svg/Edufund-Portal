// app/api/documents/route.ts
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '5')
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const applicationId = formData.get('applicationId') as string | null
    const documentType = formData.get('documentType') as string | null

    if (!file || !applicationId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Max ${MAX_SIZE_MB}MB` },
        { status: 400 }
      )
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. PDF, JPG, PNG only' },
        { status: 400 }
      )
    }

    const application = await db.application.findUnique({
      where: { id: applicationId },
      select: { userId: true },
    })

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    if (application.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const uploadPath = path.join(process.cwd(), UPLOAD_DIR, applicationId)
    await fs.mkdir(uploadPath, { recursive: true })

    const nameParts = file.name.split('.')
    const ext = nameParts.length > 1 ? nameParts.pop() : 'bin'
    const fileName = `${documentType}-${Date.now()}.${ext}`
    const filePath = path.join(uploadPath, fileName)
    const bytes = await file.arrayBuffer()
    await fs.writeFile(filePath, Buffer.from(bytes))

    const existing = await db.document.findFirst({
      where: { applicationId, documentType },
    })

    const publicPath = `/uploads/${applicationId}/${fileName}`

    const doc = existing
      ? await db.document.update({
          where: { id: existing.id },
          data: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            filePath: publicPath,
          },
        })
      : await db.document.create({
          data: {
            applicationId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            filePath: publicPath,
            documentType,
          },
        })

    return NextResponse.json({ success: true, data: { document: doc } }, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const applicationId = searchParams.get('applicationId')
  if (!applicationId) {
    return NextResponse.json(
      { success: false, error: 'applicationId required' },
      { status: 400 }
    )
  }

  const documents = await db.document.findMany({
    where: { applicationId },
    orderBy: { uploadedAt: 'desc' as const },
  })

  return NextResponse.json({ success: true, data: { documents } })
}
