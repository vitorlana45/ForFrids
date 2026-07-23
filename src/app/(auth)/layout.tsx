import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // "Ja logado" e decidido aqui, com a sessao VALIDADA (nao so o cookie). Um
  // cookie invalido nao dispara este redirect, entao nao ha loop com o layout
  // do dashboard.
  const session = await getServerSession();
  if (session) redirect('/dashboard');

  return (
    <div className="h-screen overflow-hidden bg-surface flex flex-col">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-6 bg-surface/85 backdrop-blur-md border-b border-outline-variant/20">
        <Link href="/" className="font-serif italic text-2xl text-primary">
          Eterno Pet
        </Link>
      </header>
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {children}
      </main>
    </div>
  );
}
