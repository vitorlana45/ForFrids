import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PROTECTED_ROUTES = ['/dashboard'];
const AUTH_ROUTES = ['/entrar', '/cadastrar'];

export function middleware(request: NextRequest) {
  // getSessionCookie cobre o nome com e sem o prefixo __Secure- (HTTPS em prod)
  const sessionToken = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/entrar';
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
