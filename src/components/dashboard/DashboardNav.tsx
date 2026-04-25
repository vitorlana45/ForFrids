'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

interface Props { profile: Profile | null; }

export default function DashboardNav({ profile }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="bg-[#fdfcfb]/90 border-b border-stone-100 shadow-[0_4px_20px_-5px_rgba(141,170,145,0.06)] fixed top-0 w-full z-50 backdrop-blur-md">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-2xl font-serif italic text-primary-container">
            Eterno Pet
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="/dashboard" className="text-primary-container font-semibold text-sm">Início</Link>
            <Link href="/dashboard/capsulas" className="text-stone-400 text-sm hover:bg-surface-container-low px-3 py-1 rounded-lg transition-colors">Cápsulas</Link>
            <Link href="/dashboard/qrcode" className="text-stone-400 text-sm hover:bg-surface-container-low px-3 py-1 rounded-lg transition-colors">QR Code</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-stone-500 p-2 hover:bg-surface-container-low rounded-full transition-colors">
            notifications
          </button>
          <button className="material-symbols-outlined text-stone-500 p-2 hover:bg-surface-container-low rounded-full transition-colors">
            settings
          </button>
          <div className="flex items-center gap-3 ml-2">
            <div className="w-10 h-10 rounded-full bg-primary-fixed border border-primary-container flex items-center justify-center">
              <span className="font-serif text-primary font-bold text-sm">
                {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <span className="hidden lg:block text-sm text-on-surface-variant">{profile?.full_name}</span>
          </div>
          <button onClick={signOut} className="text-stone-400 hover:text-on-surface transition-colors ml-2" title="Sair">
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
