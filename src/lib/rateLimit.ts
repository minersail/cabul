import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Rate limit configurations based on API cost and resource usage
const rateLimitConfigs = {
  // Very expensive endpoints (OpenAI API calls)
  'very-expensive': {
    limit: 3,
    window: "1 m",
    description: "OpenAI API calls (scriptslug translation)"
  },
  
  // Expensive endpoints (DeepL, HuggingFace)
  'expensive': {
    limit: 15,
    window: "1 m", 
    description: "HuggingFace tokenization/analysis"
  },
  
  // Moderate endpoints (OpenAI API calls)
  'moderate': {
    limit: 30,
    window: "1 m", 
    description: "DeepL translation"
  },
  
  // Resource intensive endpoints (web scraping)
  'resource-intensive': {
    limit: 10,
    window: "1 m",
    description: "Web scraping with Playwright"
  },
  
  // External API endpoints (with their own limits)
  'external-api': {
    limit: 30,
    window: "1 m",
    description: "Reddit API, Wiktionary, other external APIs"
  },
  
  // General API endpoints
  'general': {
    limit: 60,
    window: "1 m",
    description: "General API endpoints"
  },
  
  // Admin endpoints (stricter limits for safety)
  'admin': {
    limit: 20,
    window: "1 m",
    description: "Admin testing endpoints"
  }
} as const

export type RateLimitType = keyof typeof rateLimitConfigs

// Centralized endpoint to rate limit type mapping
// This replaces the dynamic import approach and is more reliable
const endpointRateLimits: Record<string, RateLimitType> = {
  // Very expensive endpoints (OpenAI API)
  '/api/scrape/scriptslug': 'very-expensive',
  
  // Expensive endpoints (DeepL, HuggingFace)
  '/api/tokenize': 'expensive', 
  '/api/compositionality': 'expensive',
  
  // Resource intensive endpoints (web scraping)
  '/api/scrape/lemonde': 'resource-intensive',

  // Moderate endpoints (DeepL)
  '/api/translate': 'moderate',
  
  // External API endpoints
  '/api/scrape/reddit': 'external-api',
  '/api/wiktionary': 'external-api',
  
  // Admin endpoints (add as needed)
  // '/api/admin/*': 'admin', // Will be handled by prefix matching
}

// Create Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create rate limiters for each configuration
const rateLimiters = Object.fromEntries(
  Object.entries(rateLimitConfigs).map(([key, config]) => [
    key,
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, config.window),
      analytics: true, // Track usage analytics in Upstash dashboard
      prefix: `vocab_herald_${key}`, // Namespace the keys
    })
  ])
) as Record<RateLimitType, Ratelimit>

// Rate limit result interface
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter: number | null
  type: RateLimitType
}

// Rate limit configuration interface for API routes (for documentation)
export interface RateLimitConfig {
  type: RateLimitType
}

/**
 * Check rate limit for a given identifier and endpoint type
 * @param identifier - Usually user ID, IP address, or session ID
 * @param type - Type of endpoint being accessed
 * @returns Rate limit result with success status and metadata
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'general'
): Promise<RateLimitResult> {
  try {
    const limiter = rateLimiters[type]
    const result = await limiter.limit(identifier)
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? null : Math.round((result.reset - Date.now()) / 1000),
      type
    }
  } catch (error) {
    console.error(`Rate limiting error for ${type}:`, error)
    
    // Fail open - allow request if rate limiting service is down
    // You might want to fail closed (deny request) depending on your security requirements
    return {
      success: true,
      limit: rateLimitConfigs[type].limit,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: null,
      type
    }
  }
}

/**
 * Get rate limit type for an API endpoint
 * @param pathname - The API endpoint path
 * @returns The rate limit type from the centralized mapping, or 'general' as default
 */
export function getRateLimitTypeForEndpoint(pathname: string): RateLimitType {
  // Check exact matches first
  if (endpointRateLimits[pathname]) {
    return endpointRateLimits[pathname]
  }
  
  // Check prefix matches for admin routes
  if (pathname.startsWith('/api/admin')) {
    return 'admin'
  }
  
  // Default to general rate limiting
  return 'general'
}

/**
 * Get user identifier for rate limiting
 * Prioritizes authenticated user ID, falls back to IP address
 * @param request - The incoming request
 * @param userId - Optional authenticated user ID
 * @returns Identifier string for rate limiting
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }
  
  // Try to get IP from headers (for deployments behind proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return `ip:${ip}`
}

/**
 * Create rate limit headers for API responses
 * @param result - Rate limit check result
 * @returns Headers object for the response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    'X-RateLimit-Type': result.type,
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
  }
}

/**
 * Create a standardized rate limit exceeded response
 * @param result - Rate limit check result
 * @returns NextResponse with appropriate error and headers
 */
export function createRateLimitResponse(result: RateLimitResult) {
  const config = rateLimitConfigs[result.type]
  
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests for ${config.description}. Try again in ${result.retryAfter} seconds.`,
      type: result.type,
      limit: result.limit,
      retryAfter: result.retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...createRateLimitHeaders(result)
      }
    }
  )
}

// Export configurations for reference
export { rateLimitConfigs } 