import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request)

  // Always refresh the session first (required by @supabase/ssr)
  const { data: { user } } = await supabase.auth.getUser()

  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]
  const isLocalhost = hostname.includes('localhost')
  const isMainDomain = subdomain === 'www' || subdomain === 'lokalweb' || isLocalhost

  // Handle auth routing on main domain
  if (isMainDomain) {
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

    if (isDashboard && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Handle subdomain routing for customer-facing sites
  if (!isMainDomain) {
    const url = request.nextUrl.clone()
    url.pathname = `/${subdomain}${url.pathname}`
    const rewriteResponse = NextResponse.rewrite(url)
    
    // Copy cookie updates if any
    supabaseResponse.cookies.getAll().forEach(c => {
      rewriteResponse.cookies.set(c.name, c.value, c)
    })
    
    return rewriteResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
