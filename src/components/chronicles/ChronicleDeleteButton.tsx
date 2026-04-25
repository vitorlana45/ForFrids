'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteChronicle } from '@/lib/actions/chronicles';
import OperationLoader from '@/components/ui/OperationLoader';

interface Props {
  chronicleId: string;
}

export default function ChronicleDeleteButton({ chronicleId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm('Excluir esta cronica? Esta acao nao pode ser desfeita.');
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteChronicle(chronicleId);
      if (!result.error) router.refresh();
    });
  }

  return (
    <>
      <OperationLoader active={isPending} label="Excluindo cronica" />
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-error disabled:opacity-50"
        title="Excluir cronica"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );
}
