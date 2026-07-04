import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ui/ThemeToggle';

export const metadata: Metadata = {
  title: 'Sobre - Eterno Pet',
  description:
    'O Eterno Pet nasceu da Frids, uma cachorrinha que viveu 18 anos ao lado do fundador. Conheça a história por trás do santuário digital.',
};

const YEARS = Array.from({ length: 18 }, (_, i) => i + 1);

const LESSONS = [
  {
    icon: 'favorite',
    title: 'Memória é cuidado',
    desc: 'Guardar uma história não é apego ao passado — é uma forma de continuar cuidando de quem cuidou da gente.',
  },
  {
    icon: 'self_improvement',
    title: 'O luto merece um lugar',
    desc: 'A saudade precisa de um espaço acolhedor para existir, sem pressa e sem julgamento. Aqui, ela é bem-vinda.',
  },
  {
    icon: 'all_inclusive',
    title: 'Algumas presenças ficam',
    desc: 'Um companheiro de 18 anos não vai embora de verdade. Ele muda de forma: vira lembrança, vira gratidão, vira história.',
  },
];

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary selection:text-on-primary">

      {/* ── Header ── */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-secondary/20 fixed top-0 w-full z-50">
        <div className="flex justify-between items-center w-full px-6 md:px-10 py-6 max-w-[1200px] mx-auto">
          <Link href="/" className="font-serif text-2xl font-medium tracking-widest text-primary">
            Eterno Pet
          </Link>
          <nav className="hidden md:flex gap-10 items-center">
            <Link href="/" className="font-serif text-lg tracking-tight text-on-surface-variant hover:text-primary transition-colors">Início</Link>
            <span className="font-serif text-lg tracking-tight text-primary">Sobre</span>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/entrar" className="text-primary font-medium font-serif hover:opacity-70 transition-opacity">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24">

        {/* ── Hero ── */}
        <section className="px-6 md:px-10 pt-20 md:pt-32 pb-16 max-w-[820px] mx-auto text-center space-y-8">
          <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase">A NOSSA HISTÓRIA</span>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.1] tracking-tight text-on-background">
            Antes de ser um projeto,
            <br />
            foi uma <span className="italic text-primary">despedida</span>.
          </h1>
          <p className="text-xl text-on-surface-variant leading-relaxed max-w-xl mx-auto">
            O Eterno Pet existe por causa de uma cachorrinha chamada Frids.
            Ela viveu dezoito anos — e mudou tudo o que veio depois.
          </p>
        </section>

        {/* ── 18 voltas ao sol — assinatura ── */}
        <section className="px-6 md:px-10 pb-24">
          <div className="max-w-[820px] mx-auto">
            <div className="relative bg-surface-container-lowest rounded-[3rem] border border-secondary/10 shadow-premium px-8 py-14 md:px-16 md:py-16 overflow-hidden">
              <span className="material-symbols-outlined absolute -top-10 -right-10 text-primary/5 text-[200px] pointer-events-none select-none">eco</span>

              <div className="relative z-10 text-center space-y-8">
                {/* Retrato da Frids */}
                <div className="w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-surface-container-lowest shadow-xl ring-1 ring-secondary/20 bg-surface-container-high relative">
                  <Image
                    src="/frids-viagem.jpg"
                    alt="Frids, a cachorrinha que inspirou o Eterno Pet, deitada na grama"
                    fill
                    className="object-cover object-[50%_32%]"
                    sizes="144px"
                    priority
                  />
                </div>

                <div className="flex items-baseline justify-center gap-3">
                  <span className="font-serif text-7xl md:text-8xl text-primary leading-none">18</span>
                  <span className="font-serif italic text-xl text-on-surface-variant">voltas ao sol</span>
                </div>

                {/* Uma marca por ano de vida */}
                <div className="flex flex-wrap justify-center gap-3 max-w-md mx-auto" aria-label="Dezoito anos de vida da Frids">
                  {YEARS.map((year) => (
                    <span
                      key={year}
                      className={`h-3 w-3 rounded-full ${year === 18 ? 'bg-secondary' : 'bg-primary/30'}`}
                      title={`Ano ${year}`}
                    />
                  ))}
                </div>

                <p className="font-serif italic text-lg md:text-xl leading-relaxed text-on-surface-variant max-w-lg mx-auto">
                  “Dezoito anos é quase uma vida inteira dividida. Ela esteve em cada fase,
                  cada mudança, cada recomeço. E quando partiu, ficou a pergunta:
                  onde é que se guarda tanto amor?”
                </p>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary/70">
                  Para sempre, Frids
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── A história ── */}
        <section className="bg-surface-container py-24 md:py-32 px-6 md:px-10">
          <div className="max-w-[720px] mx-auto space-y-10">
            <div className="space-y-4">
              <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase">POR QUE EXISTIMOS</span>
              <h2 className="font-serif text-3xl md:text-4xl text-on-surface tracking-tight">
                A resposta que não existia
              </h2>
            </div>
            <div className="space-y-7 text-lg leading-relaxed text-on-surface-variant">
              <p>
                A Frids chegou pequena e ficou por dezoito anos. Quem já dividiu a vida com um
                animal por tanto tempo sabe: ela não era “só uma cachorrinha”. Era testemunha
                de tudo — das manhãs comuns, dos dias difíceis, das alegrias que só ela percebia
                antes de todo mundo.
              </p>
              <p>
                Quando ela se foi, veio o vazio. E junto dele, uma inquietação: as fotos estavam
                espalhadas, as histórias só na memória, e nenhum lugar parecia digno de guardar
                uma vida daquele tamanho. Redes sociais apagam, celulares quebram, lembranças
                se dispersam.
              </p>
              <p>
                O Eterno Pet nasceu dessa falta. Um santuário digital onde a história de um
                companheiro pode ser contada com o cuidado que ela merece — com timeline,
                crônicas, tributos da família e memórias que não se perdem. O nome do
                repositório onde este projeto foi escrito, aliás, é <em>ForFrids</em>.
                Cada linha de código começou como uma homenagem.
              </p>
            </div>
          </div>
        </section>

        {/* ── O que o tempo leva ── */}
        <section className="py-24 md:py-32 px-6 md:px-10 overflow-hidden">
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-center">

            {/* Fotos reais da Frids, em estilo polaroid */}
            <div className="relative mx-auto w-full max-w-[380px] md:max-w-[440px]">
              <figure className="w-[78%] ml-auto bg-surface-container-lowest p-3 rounded-md shadow-premium rotate-2 border border-secondary/10">
                <div className="relative aspect-square overflow-hidden rounded-sm bg-surface-container-high">
                  <Image
                    src="/frids-hero.png"
                    alt="Frids descansando no sofá numa tarde comum"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 70vw, 345px"
                  />
                </div>
                <figcaption className="font-serif italic text-sm text-on-surface-variant text-center py-4 px-2">
                  Uma tarde comum no sofá — dessas que a gente jura que nunca vai esquecer.
                </figcaption>
              </figure>
              <figure className="absolute top-6 left-0 w-[52%] bg-surface-container-lowest p-2.5 rounded-md shadow-premium -rotate-3 border border-secondary/10">
                <div className="relative aspect-video overflow-hidden rounded-sm bg-surface-container-high">
                  <Image
                    src="/frids-bocejando.jpg"
                    alt="Close desfocado da Frids bocejando no colo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 55vw, 250px"
                  />
                </div>
                <figcaption className="font-serif italic text-xs text-on-surface-variant text-center py-3 px-2">
                  Tremida, desfocada — e mesmo assim, um tesouro.
                </figcaption>
              </figure>
            </div>

            {/* O relato do esquecimento */}
            <div className="space-y-7">
              <div className="space-y-4">
                <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase">O QUE O TEMPO LEVA</span>
                <h2 className="font-serif text-3xl md:text-4xl text-on-surface tracking-tight">
                  A memória, sozinha,
                  <br />
                  não guarda tudo
                </h2>
              </div>
              <div className="space-y-6 text-lg leading-relaxed text-on-surface-variant">
                <p>
                  É uma confissão difícil: mesmo depois de dezoito anos ao lado dela, alguns
                  detalhes já se apagaram. O som exato das patinhas pela casa, os pequenos
                  rituais de cada manhã, cenas inteiras que na época pareciam inesquecíveis.
                  A memória humana é assim — biológica, falível, feita para resumir. Com o
                  tempo, ela guarda o amor, mas deixa escapar os detalhes.
                </p>
                <p>
                  O que ficou foram os registros. Fotos tremidas, cliques despretensiosos de
                  um dia qualquer. Na época pareciam banais; hoje são a única porta de volta
                  para momentos que a lembrança sozinha já não alcança.
                </p>
                <p className="font-serif italic text-on-surface">
                  Registrar não é apego — é generosidade com quem você vai ser daqui a dez
                  anos. Enquanto a memória esquece, a história escrita permanece.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── O que ela ensinou ── */}
        <section className="bg-surface-container py-24 md:py-32 px-6 md:px-10">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-16 space-y-4">
              <span className="text-[11px] font-bold tracking-[0.3em] text-secondary uppercase">O QUE A FRIDS NOS ENSINOU</span>
              <h2 className="font-serif text-3xl md:text-4xl text-on-surface">Três princípios que guiam tudo aqui</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {LESSONS.map((lesson) => (
                <div
                  key={lesson.title}
                  className="bg-surface-container-lowest p-10 rounded-[2.5rem] soft-elevation border border-secondary/5 flex flex-col gap-6"
                >
                  <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">{lesson.icon}</span>
                  </div>
                  <h3 className="font-serif text-2xl text-on-surface">{lesson.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{lesson.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-inverse-surface text-inverse-on-surface py-24 md:py-32 px-6 md:px-10 relative overflow-hidden">
          <div className="max-w-[720px] mx-auto text-center space-y-8 relative z-10">
            <h2 className="font-serif text-3xl md:text-5xl tracking-tight leading-tight text-inverse-on-surface">
              A história do seu companheiro também merece um lugar
            </h2>
            <p className="text-inverse-on-surface/70 text-lg max-w-lg mx-auto">
              Se a Frids nos ensinou algo, é que nenhuma vida compartilhada deveria se perder
              no tempo. Comece o memorial de quem caminhou ao seu lado.
            </p>
            <div className="flex flex-wrap justify-center gap-5 pt-2">
              <Link
                href="/cadastrar"
                className="bg-surface-container-lowest text-primary px-10 py-5 rounded-full font-serif font-medium hover:bg-surface transition-all shadow-lg"
              >
                Criar Memorial
              </Link>
              <Link
                href="/memorial/fridis"
                className="border border-inverse-on-surface/30 text-inverse-on-surface px-10 py-5 rounded-full font-serif font-medium hover:bg-inverse-on-surface/10 transition-all"
              >
                Visitar o memorial da Frids
              </Link>
            </div>
          </div>
          <div className="absolute bottom-[-15%] left-[-5%] opacity-[0.04] pointer-events-none select-none">
            <span className="material-symbols-outlined text-[480px]">pets</span>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-16">
        <div className="flex flex-col items-center gap-6 px-6 max-w-4xl mx-auto">
          <div className="font-serif text-lg text-primary">Eterno Pet</div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link href="/" className="font-serif italic text-sm text-on-surface-variant hover:text-primary underline decoration-secondary/50 transition-all">Início</Link>
            <Link href="/privacidade" className="font-serif italic text-sm text-on-surface-variant hover:text-primary underline decoration-secondary/50 transition-all">Privacidade</Link>
            <Link href="/termos" className="font-serif italic text-sm text-on-surface-variant hover:text-primary underline decoration-secondary/50 transition-all">Termos</Link>
          </div>
          <p className="font-serif italic text-sm text-center text-on-surface-variant">
            © Eterno Pet. Feito em memória da Frids — e de todos que ficam para sempre.
          </p>
        </div>
      </footer>
    </div>
  );
}
