'use client';

import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

export default function MemorialLogoLink() {
  const { data: session } = useSession();
  return (
    <Link href={session ? '/dashboard' : '/'} className="text-2xl font-serif italic text-primary-container">
      Eterno Pet
    </Link>
  );
}
