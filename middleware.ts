import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Check if the path starts with /dashboard
  if (path.startsWith('/dashboard')) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    // If user is not authenticated, redirect to login page
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      // Store the original URL they were trying to visit
      loginUrl.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/dashboard/:path*'  // Protect all dashboard routes
  ]
}
