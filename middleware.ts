import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/track')) {
    const response = NextResponse.next()

    // Get origin from request
    const origin = request.headers.get('origin')

    // Allow requests from any origin (needed for tracking script)
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }

    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
