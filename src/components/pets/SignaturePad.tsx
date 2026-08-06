'use client';

import { useRef, useState } from 'react';
import { SIGNATURE_VIEW_W, SIGNATURE_VIEW_H } from '@/lib/memorial/letter';

interface Props {
  value: string;
  onChange: (d: string) => void;
}

export default function SignaturePad({ value, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [committed, setCommitted] = useState(value);
  const [current, setCurrent] = useState('');

  function toPoint(e: React.PointerEvent) {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    let x = 0;
    let y = 0;
    if (ctm) {
      // Mapeia coordenada de tela -> coordenada do viewBox com exatidao,
      // independente de escala/aspecto/borda (corrige o desvio da caneta).
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const local = pt.matrixTransform(ctm.inverse());
      x = local.x;
      y = local.y;
    }
    return {
      x: Math.round(Math.min(SIGNATURE_VIEW_W, Math.max(0, x))),
      y: Math.round(Math.min(SIGNATURE_VIEW_H, Math.max(0, y))),
    };
  }

  function down(e: React.PointerEvent) {
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = toPoint(e);
    last.current = { x, y };
    setCurrent(`M ${x} ${y}`);
  }

  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const { x, y } = toPoint(e);
    const l = last.current;
    if (l && Math.abs(x - l.x) < 2 && Math.abs(y - l.y) < 2) return;
    last.current = { x, y };
    setCurrent((c) => `${c} L ${x} ${y}`);
  }

  function up() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (!current) return;
    const next = committed ? `${committed} ${current}` : current;
    setCommitted(next);
    setCurrent('');
    onChange(next);
  }

  function clear() {
    setCommitted('');
    setCurrent('');
    onChange('');
  }

  const isEmpty = !committed && !current;

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIGNATURE_VIEW_W} ${SIGNATURE_VIEW_H}`}
          className="aspect-[3/1] w-full touch-none"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          onPointerCancel={up}
        >
          <line
            x1="28"
            y1="122"
            x2={SIGNATURE_VIEW_W - 28}
            y2="122"
            className="text-outline-variant/40"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 5"
          />
          <path d={committed} fill="none" className="text-primary" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={current} fill="none" className="text-primary" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {isEmpty && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-on-surface-variant/50">
            Assine aqui com o dedo ou o mouse
          </span>
        )}
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={clear}
          className="text-xs font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
