'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import type { Pet } from '@/types/database';
import { Download } from 'lucide-react';

const COLORS = [
  { label: 'Sage', fg: '#334537', bg: '#FDFBF7' },
  { label: 'Terracota', fg: '#7a573b', bg: '#fff8f3' },
  { label: 'Escuro', fg: '#1a1a1a', bg: '#ffffff' },
  { label: 'Creme', fg: '#334537', bg: '#f5ede3' },
];

const STYLES = [
  { id: 'minimal', label: 'Minimalista', radius: 0 },
  { id: 'organic', label: 'Orgânico', radius: 8 },
] as const;

const PRODUCTS = [
  { name: 'Placa Memorial em Latão', price: 'R$ 189,00', icon: 'square_foot' },
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
  const canvasRef = useRef<HTMLDivElement>(null);

  const pet = pets.find(p => p.id === selectedPetId);
  const url = pet ? `${siteUrl}/memorial/${pet.memorial_slug}` : siteUrl;
  const color = COLORS[colorIdx];
  const style = STYLES.find(s => s.id === styleId)!;

  function downloadPNG() {
    // Create an offscreen canvas at higher resolution for download
    const offscreen = document.createElement('canvas');
    offscreen.width = 800;
    offscreen.height = 800;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // Draw from the visible canvas scaled up
    const visible = canvasRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!visible) return;
    ctx.fillStyle = color.bg;
    ctx.fillRect(0, 0, 800, 800);
    ctx.drawImage(visible, 0, 0, 800, 800);

    const link = document.createElement('a');
    link.download = `qr-${pet?.memorial_slug ?? 'memorial'}.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
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

      {/* ── Left sidebar ── */}
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
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  colorIdx === i ? 'border-primary scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.fg }}
              />
            ))}
          </div>
        </div>

        {/* Download */}
        <button
          onClick={downloadPNG}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-4 rounded-full font-serif font-medium hover:bg-[#3d4d41] transition-all"
        >
          <Download className="w-4 h-4" />
          Exportar QR Digital
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="lg:col-span-8 space-y-8">

        {/* QR Preview */}
        <div
          className="rounded-3xl p-12 flex flex-col items-center gap-6 border border-outline-variant/10"
          style={{ backgroundColor: color.bg }}
        >
          <div
            ref={canvasRef}
            className="p-6 rounded-2xl shadow-lg"
            style={{ backgroundColor: color.bg, borderRadius: style.radius * 2 }}
          >
            <QRCodeCanvas
              value={url}
              size={200}
              fgColor={color.fg}
              bgColor={color.bg}
              level="H"
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
