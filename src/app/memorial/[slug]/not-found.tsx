import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export default function MemorialNotFound() {
  return (
    <div className="min-h-screen bg-[#FDF8F3] flex flex-col items-center justify-center text-center px-4">
      <Heart className="mb-6 h-16 w-16 text-secondary/40" />
      <h1 className="font-serif text-4xl text-on-surface mb-3">Memorial não encontrado</h1>
      <p className="text-muted-foreground max-w-sm mb-8">
        Esse memorial pode ter sido tornado privado ou o link está incorreto.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
