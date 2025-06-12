import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Server logged in as', data?.user?.id)

    if (error) {
      console.error('OAuth callback error:', error)
      // Redirect to error page or home with error
      return NextResponse.redirect(`${requestUrl.origin}?error=auth_failed`)
    }

    requestUrl.searchParams.delete('code');
  }

  // Redirect to the home page after successful authentication
  return NextResponse.redirect(requestUrl.origin)
} 