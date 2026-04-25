import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-6 bg-surface/85 backdrop-blur-md border-b border-outline-variant/20">
        <Link href="/" className="font-serif italic text-2xl text-primary">
          Eterno Pet
        </Link>
        <a href="#" className="text-on-surface-variant text-sm transition-colors hover:text-primary">Ajuda</a>
      </header>
      <main className="flex-grow flex flex-col md:flex-row min-h-screen">
        {children}
      </main>
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20">
        <div className="w-full py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-serif text-base text-primary">Eterno Pet</span>
            <p className="font-serif text-on-surface-variant text-sm">© 2025 Eterno Pet. Um Santuário Digital.</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Privacidade</a>
            <a href="#" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Termos</a>
            <a href="#" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
