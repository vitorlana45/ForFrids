import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-fixed selection:text-primary">

      {/* ── Header ── */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-secondary/20 fixed top-0 w-full z-50 transition-all">
        <div className="flex justify-between items-center w-full px-10 py-6 max-w-[1200px] mx-auto">
          <div className="font-serif text-2xl font-medium tracking-widest text-primary">Eterno Pet</div>
          <nav className="hidden md:flex gap-10 items-center">
            <a className="font-serif text-lg tracking-tight text-primary border-b border-secondary pb-1 cursor-pointer">Memórias</a>
            <a className="font-serif text-lg tracking-tight text-stone-400 hover:text-primary transition-colors cursor-pointer">Tributos</a>
            <a className="font-serif text-lg tracking-tight text-stone-400 hover:text-primary transition-colors cursor-pointer">Recursos</a>
          </nav>
          <div className="flex items-center gap-6">
            <Link href="/entrar" className="text-primary font-medium font-serif hover:opacity-70 transition-opacity">
              Login
            </Link>
            <Link href="/cadastrar" className="bg-primary text-on-primary px-8 py-3 rounded-full font-serif text-sm tracking-wide hover:bg-[#3d4d41] transition-all">
              Criar Memorial
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24">

        {/* ── Hero ── */}
        <section className="px-10 py-24 md:py-40 flex flex-col md:flex-row items-center gap-20 max-w-[1200px] mx-auto">
          <div className="flex-1 space-y-10">
            <h1 className="font-serif text-5xl md:text-6xl leading-[1.1] text-on-background tracking-tight">
              Eternize a história de quem sempre esteve{' '}
              <span className="italic text-primary">ao seu lado</span>
            </h1>
            <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed">
              Um santuário digital para celebrar a vida, guardar memórias e encontrar conforto
              através de tributos eternos e poéticos.
            </p>
            <div className="flex flex-wrap gap-5 pt-4">
              <Link href="/cadastrar" className="bg-primary text-on-primary px-10 py-5 rounded-full font-serif font-medium flex items-center gap-3 hover:shadow-xl hover:shadow-primary/10 transition-all">
                Começar Homenagem
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </Link>
              <Link href="/memorial/fridis" className="border border-secondary/40 text-primary px-10 py-5 rounded-full font-serif font-medium hover:bg-surface-container transition-all">
                Ver Memorial Exemplo
              </Link>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="organic-blob bg-secondary/10 w-full aspect-square absolute -top-12 -right-12 blur-3xl pointer-events-none" />
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white">
              <div className="relative w-full h-[520px]">
                <Image
                  src="/hero.png"
                  alt="Tutor abraçando seu pet"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className="absolute -bottom-10 -left-10 bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl z-20 max-w-[280px] border border-secondary/10">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-secondary">auto_awesome</span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-secondary uppercase">IA de Conforto</span>
              </div>
              <p className="font-serif italic text-stone-600 leading-relaxed text-sm">
                "Sua lealdade era um presente diário que o tempo nunca apagará."
              </p>
            </div>
          </div>
        </section>

        {/* ── Purpose Section ── */}
        <section className="bg-surface-container py-32 px-10">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-24 space-y-4">
              <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase">NOSSO PROPÓSITO</span>
              <h2 className="font-serif text-4xl text-on-surface">Um refúgio para o afeto</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { icon: 'timeline', bg: 'bg-primary/5', color: 'text-primary', title: 'Timeline da Vida', desc: 'Documente cada marco, desde a primeira patinha em casa até os momentos mais serenos da maturidade.' },
                { icon: 'lock_clock', bg: 'bg-secondary/10', color: 'text-secondary', title: 'Cápsula do Tempo', desc: 'Guarde cartas, áudios e vídeos para serem revelados em datas especiais, mantendo a conexão sempre viva.' },
                { icon: 'auto_awesome', bg: 'bg-primary-fixed/30', color: 'text-primary', title: 'IA de Tributos', desc: 'Nossa inteligência sensível ajuda a transformar sentimentos em palavras, criando homenagens poéticas e únicas.' },
              ].map((f) => (
                <div key={f.title} className="bg-white p-12 rounded-[2.5rem] soft-elevation border border-secondary/5 flex flex-col gap-8 hover:-translate-y-2 transition-all duration-700">
                  <div className={`w-16 h-16 ${f.bg} rounded-2xl flex items-center justify-center ${f.color}`}>
                    <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                  </div>
                  <h3 className="font-serif text-2xl text-on-surface">{f.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Memorial Showcase ── */}
        <section className="py-40 px-10">
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-24 items-center">
            <div className="flex-1 space-y-10">
              <span className="text-[11px] font-bold tracking-[0.3em] text-primary uppercase">SANTUÁRIO DIGITAL</span>
              <h2 className="font-serif text-4xl md:text-5xl text-on-surface leading-tight tracking-tight">
                Um refúgio visualmente poético para suas lembranças
              </h2>
              <p className="text-xl text-on-surface-variant font-serif italic leading-relaxed">
                "Cada memorial é desenhado para ser tão único quanto o laço que vocês
                compartilharam. Cores suaves e foco total na beleza da vida vivida."
              </p>
              <ul className="space-y-6">
                {['Layouts editoriais de alta qualidade', 'Galeria imersiva de fotos e vídeos', 'Espaço acolhedor para mensagens'].map((item) => (
                  <li key={item} className="flex items-center gap-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1 w-full">
              <div className="bg-white p-10 md:p-16 rounded-[3.5rem] shadow-memorial border border-surface-variant relative overflow-hidden">
                <div className="text-center space-y-8 relative z-10">
                  <div className="w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-white shadow-xl ring-1 ring-secondary/10 bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-[60px] text-primary/30">cruelty_free</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-4xl italic mb-2">Para sempre, Max</h3>
                    <p className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase opacity-70">2012 — 2024</p>
                  </div>
                  <div className="h-px w-16 bg-secondary/30 mx-auto" />
                  <p className="font-serif text-xl leading-relaxed text-stone-600 italic px-6">
                    "O melhor companheiro de trilhas e o dono do latido mais alegre do bairro.
                    Você nos ensinou o significado de amor incondicional."
                  </p>
                </div>
                <div className="mt-16 grid grid-cols-2 gap-6">
                  <div className="rounded-3xl h-40 bg-surface-container-high" />
                  <div className="rounded-3xl h-40 bg-surface-container" />
                </div>
                <span className="material-symbols-outlined absolute -top-12 -right-12 text-primary/5 text-[240px] pointer-events-none select-none">eco</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section className="bg-on-background text-surface py-40 px-10 relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-28 gap-10">
              <div className="space-y-6">
                <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase">PROCESSO</span>
                <h2 className="font-serif text-5xl text-white tracking-tight">Como criamos o eterno</h2>
              </div>
              <p className="text-stone-400 max-w-sm text-lg">Um caminho suave, respeitoso e acolhedor para preservar o que realmente importa.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
              {[
                { n: '01', title: 'Registre Momentos', desc: 'Suba fotos, vídeos e pequenos causos que definem a personalidade única do seu pet.' },
                { n: '02', title: 'Convide a Família', desc: 'Crie um círculo de amor onde todos podem deixar mensagens e compartilhar suas próprias fotos.' },
                { n: '03', title: 'Gere o Memorial', desc: 'Transforme tudo em uma página eterna ou em um livro impresso de luxo para sua estante.' },
              ].map((s) => (
                <div key={s.n} className="space-y-8 group">
                  <div className="text-9xl font-serif text-primary/20 group-hover:text-primary/40 transition-colors duration-700">{s.n}</div>
                  <h4 className="text-2xl font-serif text-white">{s.title}</h4>
                  <p className="text-stone-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-[-10%] right-[-5%] opacity-[0.03] pointer-events-none select-none">
            <span className="material-symbols-outlined text-[600px]">cruelty_free</span>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="py-40 px-10">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-28 space-y-4">
              <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase">PLANOS</span>
              <h2 className="font-serif text-5xl text-on-surface">Escolha como eternizar</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto items-center">

              {/* Free */}
              <div className="p-12 rounded-[2.5rem] border border-secondary/10 bg-surface-container flex flex-col">
                <h4 className="font-serif text-2xl mb-2 text-primary">Santuário Grátis</h4>
                <div className="text-4xl font-serif mb-8">R$ 0</div>
                <ul className="space-y-5 mb-12 flex-grow">
                  {['Memorial público simples', 'Até 50 fotos', 'Mural de condolências'].map(f => (
                    <li key={f} className="flex items-center gap-4 text-stone-600">
                      <span className="material-symbols-outlined text-secondary text-sm">done</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/cadastrar" className="w-full py-5 rounded-full border border-primary text-primary font-serif font-medium text-center hover:bg-white transition-all block">
                  Começar Agora
                </Link>
              </div>

              {/* Premium */}
              <div className="p-14 rounded-[3rem] bg-primary text-on-primary shadow-premium scale-105 z-10 flex flex-col relative overflow-hidden">
                <div className="absolute top-8 right-10 bg-secondary px-4 py-1.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase text-white">RECOMENDADO</div>
                <h4 className="font-serif text-2xl mb-2">Memorial Premium</h4>
                <div className="text-4xl font-serif mb-8">R$ 19<span className="text-xl opacity-70">/mês</span></div>
                <ul className="space-y-6 mb-14 flex-grow">
                  {['Timeline ilimitada', 'Assistente de Escrita IA', 'Cápsula do Tempo', 'Fotos em HD ilimitadas'].map(f => (
                    <li key={f} className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-secondary text-sm">done</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/cadastrar?plano=premium" className="w-full py-5 rounded-full bg-white text-primary font-serif font-medium text-center hover:bg-surface transition-all block shadow-lg">
                  Escolher Premium
                </Link>
              </div>

              {/* Lifetime */}
              <div className="p-12 rounded-[2.5rem] border border-secondary/10 bg-surface-container flex flex-col">
                <h4 className="font-serif text-2xl mb-2 text-primary">Legado Eterno</h4>
                <div className="text-4xl font-serif mb-2">R$ 490</div>
                <span className="text-base opacity-60 font-sans mb-8 block">pagamento único</span>
                <ul className="space-y-5 mb-12 flex-grow">
                  {['Tudo do plano Premium', 'Domínio personalizado', 'Memorial Book impresso'].map(f => (
                    <li key={f} className="flex items-center gap-4 text-stone-600">
                      <span className="material-symbols-outlined text-secondary text-sm">done</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/cadastrar?plano=eterno" className="w-full py-5 rounded-full border border-primary text-primary font-serif font-medium text-center hover:bg-white transition-all block">
                  Garantir Legado
                </Link>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-stone-100 border-t border-secondary/30 py-20">
        <div className="flex flex-col items-center gap-8 px-10 max-w-4xl mx-auto">
          <div className="font-serif text-lg text-primary">Eterno Pet</div>
          <div className="flex flex-wrap justify-center gap-10">
            {['Guia do Luto', 'Apoio Psicológico', 'Cerimônias', 'Privacidade'].map(l => (
              <a key={l} className="font-serif italic text-sm text-stone-500 hover:text-primary underline decoration-secondary/50 transition-all" href="#">{l}</a>
            ))}
          </div>
          <p className="font-serif italic text-sm text-center text-stone-500">
            © Eterno Pet. Um espaço para honrar quem amamos.
          </p>
        </div>
      </footer>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-surface/90 backdrop-blur-md border-t border-secondary/10 shadow-[0_-4px_20px_rgba(74,93,78,0.05)]">
        {[
          { icon: 'home', label: 'Início' },
          { icon: 'local_florist', label: 'Jardim' },
          { icon: 'auto_awesome', label: 'Velar' },
          { icon: 'person', label: 'Perfil' },
        ].map((item, i) => (
          <div key={item.label} className={`flex flex-col items-center justify-center ${i === 0 ? 'text-primary font-bold' : 'text-stone-400'} hover:scale-105 transition-transform`}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-serif text-[11px] uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
