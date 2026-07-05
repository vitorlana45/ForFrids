import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary selection:text-on-primary">

      {/* ?? Header ?? */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-secondary/20 fixed top-0 w-full z-50 transition-all">
        <div className="flex justify-between items-center w-full px-10 py-6 max-w-[1200px] mx-auto">
          <div className="font-serif text-2xl font-medium tracking-widest text-primary">Eterno Pet</div>
          <nav className="hidden md:flex gap-10 items-center">
            <a href="#proposito" className="font-serif text-lg tracking-tight text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Memórias</a>
            <a href="#tributos" className="font-serif text-lg tracking-tight text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Tributos</a>
            <a href="#planos" className="font-serif text-lg tracking-tight text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Planos</a>
            <Link href="/sobre" className="font-serif text-lg tracking-tight text-on-surface-variant hover:text-primary transition-colors">Sobre</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/entrar" className="text-primary font-medium font-serif hover:opacity-70 transition-opacity">
              Login
            </Link>
            <Link href="/cadastrar" className="bg-primary text-on-primary px-8 py-3 rounded-full font-serif text-sm tracking-wide hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all">
              Criar Memorial
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24">

        {/* ?? Hero ?? */}
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
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-surface-container-lowest">
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
            <div className="absolute -bottom-10 -left-10 bg-surface-container-lowest/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl z-20 max-w-[280px] border border-secondary/10">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-secondary">pets</span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-secondary uppercase">Memória Eterna</span>
              </div>
            <p className="font-serif italic text-on-surface-variant leading-relaxed text-sm">
                “Sua lealdade era um presente diário que o tempo nunca apagará.”
              </p>
            </div>
          </div>
        </section>

        {/* ?? Purpose Section ?? */}
        <section id="proposito" className="bg-surface-container py-32 px-10">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-24 space-y-4">
              <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase">NOSSO PROPÓSITO</span>
              <h2 className="font-serif text-4xl text-on-surface">Um refúgio para o afeto</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { icon: 'timeline', bg: 'bg-primary/5', color: 'text-primary', title: 'Timeline da Vida', desc: 'Documente cada marco, desde a primeira patinha em casa até os momentos mais serenos da maturidade.' },
                { icon: 'lock_clock', bg: 'bg-secondary/10', color: 'text-secondary', title: 'Cápsula do Tempo', desc: 'Guarde fotos e mensagens para serem revelados em datas especiais, mantendo a conexão sempre viva.' },
                { icon: 'volunteer_activism', bg: 'bg-primary-fixed/30', color: 'text-primary', title: 'Tributos da Família', desc: 'Um espaço acolhedor onde amigos e familiares deixam suas mensagens e homenagens, com moderação para preservar cada carinho.' },
              ].map((f) => (
                <div key={f.title} className="bg-surface-container-lowest p-12 rounded-[2.5rem] soft-elevation border border-secondary/5 flex flex-col gap-8 hover:-translate-y-2 transition-all duration-700">
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

        {/* ?? Memorial Showcase ?? */}
        <section id="tributos" className="py-40 px-10">
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-24 items-center">
            <div className="flex-1 space-y-10">
              <span className="text-[11px] font-bold tracking-[0.3em] text-primary uppercase">SANTUÁRIO DIGITAL</span>
              <h2 className="font-serif text-4xl md:text-5xl text-on-surface leading-tight tracking-tight">
                Um refúgio visualmente poético para suas lembranças
              </h2>
              <p className="text-xl text-on-surface-variant font-serif italic leading-relaxed">
                “Cada memorial é desenhado para ser tão único quanto o laço que vocês
                compartilharam. Cores suaves e foco total na beleza da vida vivida.”
              </p>
              <ul className="space-y-6">
                {['Layouts editoriais de alta qualidade', 'Galeria imersiva de fotos', 'Espaço acolhedor para mensagens'].map((item) => (
                  <li key={item} className="flex items-center gap-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1 w-full">
              <div className="bg-surface-container-lowest p-10 md:p-16 rounded-[3.5rem] shadow-memorial border border-surface-variant relative overflow-hidden">
                <div className="text-center space-y-8 relative z-10">
                  <div className="flex items-end justify-center -space-x-5">
                    <div className="relative z-0 h-24 w-24 overflow-hidden rounded-full border-4 border-surface-container-lowest bg-surface-container-high shadow-lg">
                      <Image
                        src="/max.webp"
                        alt="Max ainda filhote, deitado na grama"
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                    <div className="relative z-10 h-36 w-36 overflow-hidden rounded-full border-4 border-surface-container-lowest bg-surface-container-high shadow-xl ring-1 ring-secondary/10">
                      <Image
                        src="/max_hero.jpg"
                        alt="Max, um golden retriever de olhar sereno"
                        fill
                        sizes="144px"
                        className="object-cover object-[50%_22%]"
                      />
                    </div>
                    <div className="relative z-0 h-24 w-24 overflow-hidden rounded-full border-4 border-surface-container-lowest bg-surface-container-high shadow-lg">
                      <Image
                        src="/max_idoso.jpg"
                        alt="Max sorrindo ao lado da bolinha favorita"
                        fill
                        sizes="96px"
                        className="object-cover object-[50%_18%]"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-4xl italic mb-2">Para sempre, Max</h3>
                    <p className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase opacity-70">2012 - 2024</p>
                  </div>
                  <div className="h-px w-16 bg-secondary/30 mx-auto" />
                  <p className="font-serif text-xl leading-relaxed text-on-surface-variant italic px-6">
                    “O melhor companheiro de trilhas e o dono do latido mais alegre do bairro.
                    Você nos ensinou o significado de amor incondicional.”
                  </p>
                </div>
                <div className="mt-16">
                  <div className="rounded-3xl h-48 relative overflow-hidden bg-surface-container-high">
                    <Image
                      src="/max_out.jpg"
                      alt="Max no campo, sob um céu de pôr do sol"
                      fill
                      sizes="(max-width: 768px) 90vw, 540px"
                      className="object-cover object-[50%_67%]"
                    />
                  </div>
                </div>
                <span className="material-symbols-outlined absolute -top-12 -right-12 text-primary/5 text-[240px] pointer-events-none select-none">eco</span>
              </div>
            </div>
          </div>
        </section>

        {/* ?? How it Works ?? */}
        <section className="bg-inverse-surface text-inverse-on-surface py-40 px-10 relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-28 gap-10">
              <div className="space-y-6">
                <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase">PROCESSO</span>
                <h2 className="font-serif text-5xl text-inverse-on-surface tracking-tight">Como você eterniza</h2>
              </div>
              <p className="text-inverse-on-surface/70 max-w-sm text-lg">Um caminho simples e acolhedor: em três passos, suas memórias se tornam um memorial para sempre.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
              {[
                { n: '01', title: 'Registre Momentos', desc: 'Suba fotos e pequenos causos que definem a personalidade única do seu pet.' },
                { n: '02', title: 'Convide a Família', desc: 'Crie um círculo de amor onde todos podem deixar mensagens e compartilhar suas próprias fotos.' },
                { n: '03', title: 'Gere o Memorial', desc: 'Transforme tudo em uma página eterna ou em um livro impresso de luxo para sua estante.' },
              ].map((s) => (
                <div key={s.n} className="space-y-8 group">
                  <div className="text-9xl font-serif text-inverse-on-surface/20 group-hover:text-inverse-on-surface/40 transition-colors duration-700">{s.n}</div>
                  <h4 className="text-2xl font-serif text-inverse-on-surface">{s.title}</h4>
                  <p className="text-inverse-on-surface/70 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-[-10%] right-[-5%] opacity-[0.03] pointer-events-none select-none">
            <span className="material-symbols-outlined text-[600px]">cruelty_free</span>
          </div>
        </section>

        {/* ?? Pricing ?? */}
        <section id="planos" className="py-40 px-10">
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
                  {['1 memorial público', 'Linha do tempo com até 5 momentos', 'Mural de homenagens com moderação'].map(f => (
                    <li key={f} className="flex items-center gap-4 text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary text-sm">done</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/cadastrar" className="w-full py-5 rounded-full border border-primary text-primary font-serif font-medium text-center hover:bg-surface-container-low transition-all block">
                  Começar Agora
                </Link>
              </div>

              {/* Premium */}
              <div className="p-14 rounded-[3rem] bg-primary text-on-primary shadow-premium scale-105 z-10 flex flex-col relative overflow-hidden">
                <div className="absolute top-8 right-10 bg-secondary px-4 py-1.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase text-white">RECOMENDADO</div>
                <h4 className="font-serif text-2xl mb-2">Memorial Premium</h4>
                <div className="text-4xl font-serif mb-8">R$ 8,90<span className="text-xl opacity-70">/mês</span></div>
                <ul className="space-y-6 mb-14 flex-grow">
                  {['Até 5 memoriais', 'Linha do tempo com até 50 momentos', 'Diário de Crônicas e Cápsula do Tempo', 'QR Code do memorial'].map(f => (
                    <li key={f} className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-secondary text-sm">done</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/cadastrar?plano=premium" className="w-full py-5 rounded-full bg-surface-container-lowest text-primary font-serif font-medium text-center hover:bg-surface transition-all block shadow-lg">
                  Escolher Premium
                </Link>
              </div>

              {/* Anual */}
              <div className="p-12 rounded-[2.5rem] border border-secondary/10 bg-surface-container flex flex-col">
                <h4 className="font-serif text-2xl mb-2 text-primary">Premium Anual</h4>
                <div className="text-4xl font-serif mb-2">R$ 89,00<span className="text-xl opacity-70">/ano</span></div>
                <span className="text-base opacity-60 font-sans mb-8 block">equivale a R$ 7,42/mês</span>
                <ul className="space-y-5 mb-12 flex-grow">
                  {['Tudo do plano Premium', '2 meses grátis', 'Economize R$ 17,80 no ano'].map(f => (
                    <li key={f} className="flex items-center gap-4 text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary text-sm">done</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/cadastrar?plano=anual" className="w-full py-5 rounded-full border border-primary text-primary font-serif font-medium text-center hover:bg-surface-container-low transition-all block">
                  Assinar Anual
                </Link>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* ?? Footer ?? */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-20">
        <div className="flex flex-col items-center gap-8 px-10 max-w-4xl mx-auto">
          <div className="font-serif text-lg text-primary">Eterno Pet</div>
          <div className="flex flex-wrap justify-center gap-10">
            <Link href="/sobre" className="font-serif italic text-sm text-on-surface-variant hover:text-primary underline decoration-secondary/50 transition-all">Sobre</Link>
            <Link href="/privacidade" className="font-serif italic text-sm text-on-surface-variant hover:text-primary underline decoration-secondary/50 transition-all">Privacidade</Link>
            <Link href="/termos" className="font-serif italic text-sm text-on-surface-variant hover:text-primary underline decoration-secondary/50 transition-all">Termos</Link>
            {['Guia do Luto', 'Apoio Psicológico', 'Cerimônias'].map(l => (
              <span key={l} className="font-serif italic text-sm text-on-surface-variant/40">{l}</span>
            ))}
          </div>
          <p className="font-serif italic text-sm text-center text-on-surface-variant">
            © Eterno Pet. Um espaço para honrar quem amamos.
          </p>
        </div>
      </footer>

      {/* ?? Mobile Bottom Nav ?? */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-surface/90 backdrop-blur-md border-t border-secondary/10 shadow-[0_-4px_20px_rgba(74,93,78,0.05)]">
        {[
          { icon: 'home', label: 'Início', href: '/' },
          { icon: 'local_florist', label: 'Jardim', href: '#proposito' },
          { icon: 'auto_awesome', label: 'Velar', href: '#planos' },
          { icon: 'person', label: 'Perfil', href: '/entrar' },
        ].map((item, i) => (
          <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center ${i === 0 ? 'text-primary font-bold' : 'text-on-surface-variant'} hover:scale-105 transition-transform`}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-serif text-[11px] uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
