import { useEffect, useRef, useState } from 'react';

export const TASAS_FALLBACK = {
  usdVes: 791.32,
  copUsd: 3120,
  eurVes: 921.81,
};

const STORAGE_KEY = 'strata_tasas_cache';

function cargarCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.usdVes && data.copUsd && data.eurVes) return data;
  } catch { /* ignore */ }
  return null;
}

async function fetchTasas() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error('API no disponible');
  const json = await res.json();
  const rates = json.rates;
  if (!rates || !rates.VES || !rates.COP || !rates.EUR) throw new Error('Respuesta inválida');
  return {
    usdVes: Number(rates.VES),
    copUsd: Number(rates.COP),
    eurVes: Number(rates.VES) / Number(rates.EUR),
  };
}

export function useTasas() {
  const cache = useRef(cargarCache()).current;
  const [tasas, setTasas] = useState(cache || TASAS_FALLBACK);
  const [fuente, setFuente] = useState(cache ? 'cache' : 'offline');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const data = await fetchTasas();
        if (!activo) return;
        const redondeado = {
          usdVes: Number(data.usdVes.toFixed(2)),
          copUsd: Math.round(data.copUsd),
          eurVes: Number(data.eurVes.toFixed(2)),
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(redondeado)); } catch { /* ignore */ }
        setTasas(redondeado);
        setFuente('live');
      } catch {
        if (!activo) return;
        setFuente(cache ? 'cache' : 'offline');
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { tasas, fuente, cargando };
}