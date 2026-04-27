import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso — Eterno Pet',
  description: 'Termos de uso do Eterno Pet.',
};

const SECTIONS = [
  {
    title: 'Aceitação dos termos',
    body: 'Ao criar uma conta no Eterno Pet, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço. Podemos atualizar estes termos periodicamente — notificaremos por e-mail em caso de mudanças relevantes.',
  },
  {
    title: 'Uso do serviço',
    body: 'O Eterno Pet é uma plataforma para criação de memoriais digitais de pets. Você é responsável pelo conteúdo que publica. É proibido publicar conteúdo ofensivo, enganoso ou que viole direitos de terceiros.',
  },
  {
    title: 'Propriedade do conteúdo',
    body: 'Você mantém todos os direitos sobre fotos, textos e mídias que enviar. Ao publicar, concede ao Eterno Pet uma licença limitada para exibir esse conteúdo no contexto do seu memorial.',
  },
  {
    title: 'Planos e pagamentos',
    body: 'Os planos pagos são cobrados conforme descrito na página de Planos. Assinaturas mensais podem ser canceladas a qualquer momento. O plano Eterno (vitalício) não é reembolsável após 7 dias da compra.',
  },
  {
    title: 'Suspensão e encerramento',
    body: 'Reservamos o direito de suspender contas que violem estes termos. Em caso de encerramento voluntário, seus dados serão excluídos conforme descrito na Política de Privacidade.',
  },
  {
    title: 'Limitação de responsabilidade',
    body: 'O Eterno Pet é fornecido "como está". Não garantimos disponibilidade ininterrupta do serviço. Em nenhuma hipótese seremos responsáveis por danos indiretos decorrentes do uso da plataforma.',
  },
  {
    title: 'Lei aplicável',
    body: 'Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida no foro da comarca de domicílio do usuário.',
  },
];

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20">
        <div className="max-w-[1200px] mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/" className="font-serif italic text-2xl text-primary">Eterno Pet</Link>
          <Link href="/" className="text-sm text-on-surface-variant hover:text-primary transition-colors">← Voltar</Link>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-6 pt-40 pb-24">
        <header className="mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-3">Legal</p>
          <h1 className="font-serif text-5xl text-on-surface mb-4">Termos de Uso</h1>
          <p className="text-on-surface-variant">Última atualização: Janeiro de 2025</p>
        </header>

        <div className="space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="font-serif text-2xl text-on-surface mb-3">{section.title}</h2>
              <p className="text-on-surface-variant leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-outline-variant/20 flex gap-6 text-sm">
          <Link href="/privacidade" className="text-primary hover:underline underline-offset-4">Privacidade</Link>
          <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors">Início</Link>
        </div>
      </main>
    </div>
  );
}
