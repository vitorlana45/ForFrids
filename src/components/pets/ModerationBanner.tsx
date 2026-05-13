import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface Props {
  status: 'flagged' | 'hidden' | 'blocked';
  reason?: string | null;
  blockedAt?: Date | string | null;
}

const COPY = {
  flagged: {
    icon: AlertTriangle,
    title: 'Este memorial recebeu denúncias',
    description:
      'Recebemos sinalizações de visitantes sobre este conteúdo. Nossa equipe vai revisar — o memorial continua público durante a análise.',
    tone: 'bg-yellow-50 border-yellow-300 text-yellow-900 dark:bg-yellow-950/40 dark:border-yellow-700/40 dark:text-yellow-100',
  },
  hidden: {
    icon: ShieldAlert,
    title: 'Memorial oculto durante revisão',
    description:
      'O memorial foi temporariamente escondido enquanto nossa equipe analisa as denúncias recebidas. Ele voltará automaticamente se for considerado dentro das diretrizes.',
    tone: 'bg-orange-50 border-orange-300 text-orange-900 dark:bg-orange-950/40 dark:border-orange-700/40 dark:text-orange-100',
  },
  blocked: {
    icon: ShieldAlert,
    title: 'Memorial bloqueado',
    description:
      'Nossa equipe identificou que este memorial viola as diretrizes da plataforma. Ele não está mais visível publicamente.',
    tone: 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/40 dark:border-red-700/40 dark:text-red-100',
  },
} as const;

function formatDate(value: Date | string | null | undefined) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export default function ModerationBanner({ status, reason, blockedAt }: Props) {
  const copy = COPY[status];
  const Icon = copy.icon;
  const date = formatDate(blockedAt);

  return (
    <div className={`mb-8 flex items-start gap-3 rounded-2xl border px-5 py-4 ${copy.tone}`} role="alert">
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-1 leading-relaxed">{copy.description}</p>
        {reason && (
          <p className="mt-3 rounded-lg bg-black/5 px-3 py-2 text-xs dark:bg-white/5">
            <span className="font-semibold">Motivo da equipe:</span> {reason}
          </p>
        )}
        {date && (
          <p className="mt-2 text-xs opacity-70">
            {status === 'blocked' ? 'Bloqueado em' : 'Sinalizado em'} {date}
          </p>
        )}
        {status === 'blocked' && (
          <p className="mt-3 text-xs">
            Se você acredita que houve um erro, responda ao e-mail que enviamos ou entre em contato pelo suporte para contestar a decisão.
          </p>
        )}
      </div>
    </div>
  );
}
