"use client";
import React, { useEffect, useState, useMemo } from 'react';
import type { NormalizedForecast } from '../../../types/forecast';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/Skeleton';
import { MetricSelector } from '../../components/forecast/MetricSelector';
import { DetailedMetric } from '../../components/forecast/DetailedMetric';
import { MiniSparkline } from '../../components/forecast/MiniSparkline';
import { cx } from '../../lib/cx';

interface StoredLocation {
  lat?: number; lng?: number; formattedAddress?: string; cidade?: string; pais?: string;
}
interface StoredEventData { form?: { date?: string; hour?: string; cidade?: string; }; location?: StoredLocation; savedAt?: number; }
interface ExplainResponse { explanation?: string; ok?: boolean; error?: string; details?: string; choices?: Array<{ message?: { content?: string } }>; }

function isStoredEventData(v: unknown): v is StoredEventData { return typeof v === 'object' && v !== null; }

// Componentes reutilizados foram extraídos para /components

export default function Resultado() {
  const [eventData, setEventData] = useState<StoredEventData | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [forecast, setForecast] = useState<NormalizedForecast | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [sourceTag, setSourceTag] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('eventData') || sessionStorage.getItem('locationData');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (isStoredEventData(parsed)) setEventData(parsed);
      } catch {/* noop */}
    }
    try {
      const fRaw = sessionStorage.getItem('forecastData');
      if (fRaw) {
        const fParsed = JSON.parse(fRaw);
        if (fParsed && typeof fParsed === 'object' && 'metrics' in fParsed) {
          const normalized = fParsed as NormalizedForecast & { source?: string };
            setForecast(normalized);
            const srcRaw = (fParsed as { source?: unknown }).source;
            const src: string | null = typeof srcRaw === 'string' ? srcRaw : null;
            setSourceTag(src);
            const order = ['temperature','rain','humidity','wind_speed','water_vapor'];
            const keys = Object.keys(normalized.metrics || {});
            const first = order.find(o => keys.includes(o)) || keys[0] || null;
            if (first) setSelectedMetric(first);
        }
      }
    } catch {/* ignore */}
    setMounted(true);
  }, []);

  const displayDate = useMemo(() => {
    if (!eventData?.form?.date) return '—';
    const iso = eventData.form.hour ? `${eventData.form.date}T${eventData.form.hour}:00` : `${eventData.form.date}T00:00:00`;
    try { return new Date(iso).toLocaleString(); } catch { return eventData.form.date; }
  }, [eventData]);

  async function handleExplain() {
    if (!eventData) return;
    
    // Se já tem explicação, apenas toggle a visibilidade
    if (explanation) {
      setShowExplanation(!showExplanation);
      return;
    }
    
    setLoadingExplain(true);
    setExplanation(null);
    setError(null);
    const payload = {
      lat: eventData.location?.lat,
      lng: eventData.location?.lng,
      address: eventData.location?.formattedAddress || eventData.location?.cidade,
      date: eventData.form?.date,
      hour: eventData.form?.hour,
    };
    try {
      const res = await fetch('/api/ai/explain-weather', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const ct = res.headers.get('content-type') || '';
      const rawText = await res.text();
      if (!ct.includes('application/json')) {
        if (res.ok) setExplanation(rawText || 'Resposta vazia.'); else throw new Error(`Erro não-JSON: ${res.status}`);
      } else {
        let data: ExplainResponse; try { data = JSON.parse(rawText); } catch { throw new Error('JSON inválido'); }
        if (!res.ok || data.ok === false) throw new Error(data.error || data.details || 'Erro na API');
        const txt = data.explanation || data.choices?.[0]?.message?.content || 'Sem resposta da IA';
        setExplanation(txt);
        setShowExplanation(true);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro inesperado');
    } finally { setLoadingExplain(false); }
  }

  const loadingUI = (
    <div className="space-y-4 mb-10">
      <Skeleton className="h-12" />
      <Skeleton className="h-56" />
      <Skeleton className="h-40" />
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Resultado</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Previsão & insight gerado por IA para o seu evento.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge tone="info">Data: {displayDate}</Badge>
          {eventData?.location?.formattedAddress && <Badge>{eventData.location.formattedAddress}</Badge>}
          {eventData?.location?.lat && <Badge tone="success">Lat {eventData.location.lat.toFixed(2)}</Badge>}
          {eventData?.location?.lng && <Badge tone="success">Lng {eventData.location.lng.toFixed(2)}</Badge>}
        </div>
      </header>

      {!mounted && loadingUI}
      {mounted && forecast && (
        <section className="mb-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <MetricSelector metrics={forecast.metrics} current={selectedMetric} onSelect={setSelectedMetric} />
              {sourceTag && sourceTag !== 'backend' && <Badge tone="danger">Mock</Badge>}
              {sourceTag === 'backend' && <Badge tone="success">Real</Badge>}
            </div>
            <button
              onClick={handleExplain}
              disabled={loadingExplain || !eventData}
              className={cx(
                'relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition border backdrop-blur-sm',
                'bg-[var(--accent)] text-[var(--accent)] border-[var(--accent)] shadow hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[var(--accent)]'
              )}
            >
              {loadingExplain && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white text-sky-600" />}
              {loadingExplain 
                ? 'Gerando...' 
                : explanation 
                  ? (showExplanation ? 'Ocultar Explicação' : 'Mostrar Explicação')
                  : 'Explicar com IA'
              }
            </button>
          </div>
          {(!eventData || error) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {!eventData && <p className="text-rose-500">Nenhum dado carregado ainda.</p>}
              {error && <p className="text-rose-500">{error}</p>}
            </div>
          )}
          {selectedMetric && forecast.metrics[selectedMetric] && (
            <DetailedMetric name={selectedMetric} metric={forecast.metrics[selectedMetric]} />
          )}
          {explanation && showExplanation && (
            <Card title="Explicação da IA" className="prose max-w-none dark:prose-invert">
              <div className="prose-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: explanation }} />
            </Card>
          )}
        </section>
      )}

      <section className="mb-14">
        {forecast && (
          <Card title="Gráfico Principal" footer="Atualmente apenas temperatura possui série completa; outras métricas exibirão placeholder.">
            <div className="h-60 w-full relative overflow-hidden rounded-lg flex items-center justify-center">
              {selectedMetric === 'temperature' && forecast.metrics.temperature?.series ? (
                <div className="w-full h-full flex items-center justify-center">
                  <MiniSparkline values={(forecast.metrics.temperature.series || []) as number[]} />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[10px] text-[var(--muted-foreground)]">
                  <span>Sem série detalhada para {selectedMetric?.replace(/_/g,' ') || '—'}</span>
                  <span>Quando disponível: curva temporal e estatísticas ampliadas.</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </section>

      <footer className="pb-10 text-center text-[10px] text-[var(--muted-foreground)]">
        Interface protótipo • Hackathon NASA 2025 • Ajustes visuais pendentes da API real
      </footer>
    </main>
  );
}
