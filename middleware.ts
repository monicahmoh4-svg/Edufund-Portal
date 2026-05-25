// middleware.ts — Lightweight route protection
// Auth is handled client-side by DashboardShell/useAuth
// API route auth is handled by requireAuth/requireAdmin in each route handler
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // All API routes — let individual handlers enforce auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // All page routes — allow through
  // DashboardShell redirects to /auth/login if no token in Zustand store
  // Admin layout redirects to /auth/login if not admin
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
