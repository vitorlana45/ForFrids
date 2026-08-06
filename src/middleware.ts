import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard'];
// Cookie de sessao do better-auth (default). Em HTTPS ganha o prefixo __Secure-.
const SESSION_COOKIE = 'better-auth.session_token';

export function middleware(request: NextRequest) {
  // So checamos a EXISTENCIA do cookie de sessao (com/sem o prefixo __Secure-).
  // Lemos direto do request em vez de usar better-auth/cookies (getSessionCookie)
  // porque aquele modulo importa `jose`, que usa APIs de Node (CompressionStream)
  // nao suportadas no Edge Runtime do middleware -> gerava warning no build.
  // A validacao real da sessao fica nos layouts via getServerSession (Node).
  const sessionToken =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.cookies.get(`__Secure-${SESSION_COOKIE}`)?.value;
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
