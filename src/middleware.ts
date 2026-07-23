import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PROTECTED_ROUTES = ['/dashboard'];

export function middleware(request: NextRequest) {
  // getSessionCookie apenas verifica a EXISTENCIA do cookie (com/sem o prefixo
  // __Secure- em HTTPS). Ele NAO valida a sessao no banco.
  const sessionToken = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));

  // So barramos rota protegida SEM cookie de sessao. A validacao real da sessao
  // (o cookie pode existir mas estar expirado/invalido) fica no layout do
  // dashboard via getServerSession -> redirect('/entrar').
  //
  // NAO redirecionamos rotas de auth (/entrar, /cadastrar) aqui. Fazer isso com
  // base apenas na existencia do cookie criava um loop infinito quando o cookie
  // existia mas a sessao era invalida: /entrar ->(middleware) /dashboard
  // ->(layout, sessao invalida) /entrar -> ... O "ja logado -> /dashboard" agora
  // mora no layout de (auth), com a sessao validada por getServerSession (o
  // mesmo sinal que o dashboard usa), o que torna o loop impossivel.
  if (isProtected && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/entrar';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
