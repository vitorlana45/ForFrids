'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteChronicle } from '@/lib/actions/chronicles';
import OperationLoader from '@/components/ui/OperationLoader';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

interface Props {
  chronicleId: string;
}

export default function ChronicleDeleteButton({ chronicleId }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'Excluir crônica',
      message: 'Esta ação não pode ser desfeita. A crônica será removida permanentemente.',
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteChronicle(chronicleId);
      if (result.error) {
        toast.error('Erro ao excluir a crônica. Tente novamente.');
      } else {
        toast.success('Crônica excluída com sucesso.');
        router.refresh();
      }
    });
  }

  return (
    <>
      <OperationLoader active={isPending} label="Excluindo crônica" />
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-error disabled:opacity-50"
        title="Excluir crônica"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );
}
