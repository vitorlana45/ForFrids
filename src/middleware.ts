import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard'];
const AUTH_ROUTES = ['/entrar', '/cadastrar'];
const SESSION_COOKIE = 'better-auth.session_token';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
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
