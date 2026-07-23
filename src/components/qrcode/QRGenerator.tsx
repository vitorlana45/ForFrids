'use client';

import { useEffect, useRef, useState } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import type { Options } from 'qr-code-styling';
import type { Pet } from '@/types/database';
import { Download } from 'lucide-react';

const COLORS = [
  { label: 'Sálvia',         fg: '#334537', bg: '#FDFBF7' },
  { label: 'Terracota',      fg: '#7A573B', bg: '#FFF8F3' },
  { label: 'Preto & Branco', fg: '#171717', bg: '#FFFFFF' },
  { label: 'Creme',          fg: '#334537', bg: '#F1E7D6' },
];

const STYLES = [
  { id: 'minimal', label: 'Minimalista' },
  { id: 'organic', label: 'Orgânico' },
] as const;

const PRODUCTS = [
  { name: 'Placa Memorial em Latéo', price: 'R$ 189,00', icon: 'square_foot' },
  { name: 'Medalha de Coleira Silver', price: 'R$ 124,00', icon: 'star' },
  { name: 'Porta-Retrato Heritage', price: 'R$ 245,00', icon: 'photo_frame' },
];

interface Props {
  pets: Pick<Pet, 'id' | 'name' | 'memorial_slug' | 'species'>[];
  siteUrl: string;
}

export default function QRGenerator({ pets, siteUrl }: Props) {
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id ?? '');
  const [colorIdx, setColorIdx] = useState(0);
  const [styleId, setStyleId] = useState<'minimal' | 'organic'>('minimal');
  const holderRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  const pet = pets.find(p => p.id === selectedPetId);
  const url = pet ? `${siteUrl}/memorial/${pet.memorial_slug}` : siteUrl;
  const color = COLORS[colorIdx];
  const organic = styleId === 'organic';

  // Renderiza o QR estilizado no client (a lib usa DOM/canvas -> import dinamico).
  useEffect(() => {
    if (pets.length === 0) return;
    let cancelled = false;
    (async () => {
      const QRCodeStylingCtor = (await import('qr-code-styling')).default;
      if (cancelled || !holderRef.current) return;

      const options: Options = {
        width: 520,
        height: 520,
        type: 'canvas',
        data: url,
        margin: 10,
        qrOptions: { errorCorrectionLevel: 'H' },
        dotsOptions: { color: color.fg, type: organic ? 'rounded' : 'square' },
        cornersSquareOptions: { color: color.fg, type: organic ? 'extra-rounded' : 'square' },
        cornersDotOptions: { color: color.fg, type: organic ? 'dot' : 'square' },
        backgroundOptions: { color: color.bg },
      };

      const qr = new QRCodeStylingCtor(options);
      holderRef.current.innerHTML = '';
      qr.append(holderRef.current);
      qrRef.current = qr;
    })();
    return () => { cancelled = true; };
  }, [url, color.fg, color.bg, organic, pets.length]);

  async function downloadPNG() {
    await qrRef.current?.download({
      name: `qr-${pet?.memorial_slug ?? 'memorial'}`,
      extension: 'png',
    });
  }

  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low py-32 text-center">
        <span className="material-symbols-outlined text-[64px] text-outline mb-4">qr_code_2</span>
        <p className="font-serif text-xl text-on-surface-variant">Crie um pet para gerar o QR Code.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* Sidebar */}
      <aside className="lg:col-span-4 space-y-6">

        {/* Pet selector */}
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 space-y-3">
          <h3 className="font-serif text-lg text-on-surface">Pet</h3>
          <select
            value={selectedPetId}
            onChange={e => setSelectedPetId(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-on-surface text-sm focus:ring-2 focus:ring-primary/30"
          >
            {pets.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
            ))}
          </select>
        </div>

        {/* Style */}
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 space-y-3">
          <h3 className="font-serif text-lg text-on-surface">Estilo</h3>
          <div className="grid grid-cols-2 gap-3">
            {STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setStyleId(s.id)}
                className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                  styleId === s.id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 space-y-3">
          <h3 className="font-serif text-lg text-on-surface">Cores</h3>
          <div className="flex gap-3">
            {COLORS.map((c, i) => (
              <button
                key={c.label}
                onClick={() => setColorIdx(i)}
                title={c.label}
                aria-label={`Cor ${c.label}`}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                  colorIdx === i
                    ? 'border-primary ring-2 ring-primary/40 scale-110'
                    : 'border-outline-variant/40 hover:scale-105'
                }`}
                style={{ backgroundColor: c.bg }}
              >
                <span className="block h-4 w-4 rounded-full" style={{ backgroundColor: c.fg }} />
              </button>
            ))}
          </div>
        </div>

        {/* Download */}
        <button
          onClick={downloadPNG}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-4 rounded-full font-serif font-medium hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim transition-all"
        >
          <Download className="w-4 h-4" />
          Exportar QR Digital
        </button>
      </aside>

      {/* Main */}
      <div className="lg:col-span-8 space-y-8">

        {/* QR Preview */}
        <div
          className="rounded-3xl p-12 flex flex-col items-center gap-6 border border-outline-variant/10"
          style={{ backgroundColor: color.bg }}
        >
          <div
            className="p-4 shadow-lg"
            style={{ backgroundColor: color.bg, borderRadius: organic ? 28 : 8 }}
          >
            <div
              ref={holderRef}
              className="mx-auto w-56 [&>canvas]:h-auto [&>canvas]:w-full"
            />
          </div>

          <div className="text-center">
            <p className="font-serif text-xl" style={{ color: color.fg }}>
              {pet?.name}
            </p>
            <p className="text-xs mt-1 font-mono opacity-50 break-all max-w-[240px]" style={{ color: color.fg }}>
              {url}
            </p>
          </div>

        </div>

        {/* Products showcase */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl text-on-surface">Produtos com QR Code</h3>
            <span className="text-xs text-on-surface-variant bg-secondary-container px-3 py-1 rounded-full">Em breve</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PRODUCTS.map(product => (
              <div key={product.name} className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 space-y-3">
                <span className="material-symbols-outlined text-3xl text-secondary">{product.icon}</span>
                <p className="font-semibold text-on-surface text-sm">{product.name}</p>
                <p className="text-primary font-bold">{product.price}</p>
                <button disabled className="w-full py-2 rounded-full border border-outline-variant/30 text-xs text-on-surface-variant opacity-50 cursor-not-allowed">
                  Em breve
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
