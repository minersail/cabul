import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { 
  checkRateLimit, 
  getRateLimitTypeForEndpoint, 
  getRateLimitIdentifier,
  createRateLimitResponse,
  createRateLimitHeaders
} from '@/lib/rateLimit'

async function handleApiAuthentication(
  request: NextRequest, 
  user: any
): Promise<NextResponse | null> {
  // Skip server actions (they have the next-action header)
  if (request.headers.get('next-action')) {
    return null
  }
  
  // Define routes that should NOT require authentication
  const publicApiRoutes = [
    '/api/auth/', // Supabase auth callbacks (if any)
    '/api/health', // Health check endpoint (if you add one)
  ]
  
  const isPublicRoute = publicApiRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // Check authentication for protected routes
  if (!isPublicRoute && !user) {
    return NextResponse.json(
      { 
        error: 'Authentication required',
        message: 'You must be signed in to access this API endpoint'
      }, 
      { status: 401 }
    )
  }

  return null // Continue processing
}

async function handleApiRateLimit(
  request: NextRequest,
  user: any,
  response: NextResponse
): Promise<Response | null> {
  const rateLimitType = getRateLimitTypeForEndpoint(request.nextUrl.pathname)
  const identifier = getRateLimitIdentifier(request, user?.id)
  
  try {
    const rateLimitResult = await checkRateLimit(identifier, rateLimitType)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    // Add rate limit headers to successful responses
    const headers = createRateLimitHeaders(rateLimitResult)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  } catch (rateLimitError) {
    console.error('Rate limiting error:', rateLimitError)
    // Continue without rate limiting if there's an error
  }

  return null // Continue processing
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Get user for authentication checks
    const { data: { user } } = await supabase.auth.getUser()
    
    // Protect app routes - redirect to login if not authenticated
    if (request.nextUrl.pathname.startsWith('/app') && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Handle API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // Check authentication
      const authResponse = await handleApiAuthentication(request, user)
      if (authResponse) return authResponse

      // Check rate limits
      const rateLimitResponse = await handleApiRateLimit(request, user, supabaseResponse)
      if (rateLimitResponse) return rateLimitResponse
    }

    return supabaseResponse
    
  } catch (error) {
    console.error('Middleware error:', error)
    // Return the original response if middleware fails
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    '/app/:path*',
    '/api/:path*'
  ]
} 