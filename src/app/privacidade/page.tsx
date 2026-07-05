import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacidade — Eterno Pet',
  description: 'Política de privacidade do Eterno Pet.',
};

const SECTIONS = [
  {
    title: 'Dados que coletamos',
    body: 'Coletamos seu nome, e-mail e informações dos memoriais que você cria. Fotos e mídias enviadas são armazenadas de forma segura e nunca compartilhadas com terceiros sem seu consentimento.',
  },
  {
    title: 'Como usamos seus dados',
    body: 'Seus dados são usados exclusivamente para operar e melhorar o Eterno Pet: autenticação, exibição dos memoriais, envio de notificações relacionadas à conta e processamento seguro de pagamentos via Stripe.',
  },
  {
    title: 'Compartilhamento',
    body: 'Não vendemos nem alugamos seus dados. Compartilhamos informações apenas com provedores essenciais (Stripe para pagamentos, provedor SMTP/e-mail transacional e armazenamento de mídia compatível com S3) sob contratos de confidencialidade.',
  },
  {
    title: 'Seus direitos',
    body: 'Você pode solicitar a exclusão da sua conta e todos os dados associados a qualquer momento nas Configurações. Para solicitações específicas, entre em contato via suporte.',
  },
  {
    title: 'Segurança',
    body: 'Utilizamos criptografia em trânsito (HTTPS) e em repouso. Senhas nunca são armazenadas em texto claro. Seguimos as melhores práticas da indústria para proteger suas informações.',
  },
  {
    title: 'Cookies',
    body: 'Usamos apenas cookies essenciais para autenticação e preferências de tema. Não utilizamos cookies de rastreamento ou publicidade.',
  },
];

export default function PrivacidadePage() {
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
          <h1 className="font-serif text-5xl text-on-surface mb-4">Política de Privacidade</h1>
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
          <Link href="/termos" className="text-primary hover:underline underline-offset-4">Termos de Uso</Link>
          <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors">Início</Link>
        </div>
      </main>
    </div>
  );
}
