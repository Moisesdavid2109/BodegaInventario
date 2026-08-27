import React from 'react';
import { useTasas } from '../../lib/tasas';

function fmt(n, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(n) || 0);
}

function RateCard({ grad, simbolo, par, valor, unidad, subtexto }) {
  return (
    <div className={`rate-card ${grad} p-4 sm:p-5 flex items-center gap-4 relative overflow-hidden`}>
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" aria-hidden="true" />
      <div className="absolute -bottom-10 -right-2 w-24 h-24 rounded-full bg-black/5" aria-hidden="true" />
      <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center font-extrabold text-lg shadow-inner">
        {simbolo}
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-90">{par}</div>
        <div className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
          {valor} <span className="text-[0.7em] font-bold opacity-90">{unidad}</span>
        </div>
        <div className="text-[11px] opacity-85 mt-0.5">{subtexto}</div>
      </div>
    </div>
  );
}

export default function RateCards() {
  const { tasas, fuente, cargando } = useTasas();

  return (
    <div className="flex flex-col gap-4">
      <RateCard
        grad="rate-grad-orange"
        simbolo="$/Bs"
        par="USD / VES"
        valor={fmt(tasas.usdVes, 2)}
        unidad="Bs"
        subtexto="Tasa Oficial $1 USD"
      />
      <RateCard
        grad="rate-grad-navy"
        simbolo="$/COP"
        par="COP / USD"
        valor={fmt(tasas.copUsd, 0)}
        unidad="COP"
        subtexto="Tasa Cambio $1 USD"
      />
      <RateCard
        grad="rate-grad-green"
        simbolo="€/Bs"
        par="EUR / VES"
        valor={fmt(tasas.eurVes, 2)}
        unidad="Bs"
        subtexto="Tasa Oficial €1 EUR"
      />

      <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400 font-medium">
        {cargando ? (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" /> Actualizando tasas…
          </span>
        ) : fuente === 'live' ? (
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" /> Tasas en vivo (open.er-api.com)
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Sin conexión · mostrando última tasa guardada
          </span>
        )}
      </div>
    </div>
  );
}