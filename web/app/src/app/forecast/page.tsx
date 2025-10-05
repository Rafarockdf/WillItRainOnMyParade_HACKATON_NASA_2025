'use client';
import { useEffect, useState, useMemo } from 'react';
// Removido fetchForecast direto; a previsão será carregada do sessionStorage futuramente
import type { NormalizedForecast, ForecastMetric } from '../../../types/forecast';

// Pequena função util local para compor classes sem depender de pacote externo
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

interface StoredLocation {
  lat?: number; lng?: number; formattedAddress?: string; cidade?: string; pais?: string;
}
interface StoredEventData { form?: { date?: string; hour?: string; cidade?: string; }; location?: StoredLocation; savedAt?: number; }
interface ExplainResponse { explanation?: string; ok?: boolean; error?: string; details?: string; choices?: Array<{ message?: { content?: string } }>; }

function isStoredEventData(v: unknown): v is StoredEventData { return typeof v === 'object' && v !== null; }

// Skeleton shimmer
function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded bg-[var(--muted)]/40', className)} />;
}

// Card base
function Card(props: React.PropsWithChildren<{ title?: string; className?: string; footer?: React.ReactNode }>) {
  return (
    <div className={cx('group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/70 backdrop-blur-sm shadow-sm transition hover:shadow-md dark:shadow-none', props.className)}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-white/5 to-transparent" />
      <div className="p-4 sm:p-5">
        {props.title && <h3 className="mb-2 text-sm font-semibold tracking-wide text-[var(--foreground)]/80 uppercase">{props.title}</h3>}
        {props.children}
      </div>
      {props.footer && <div className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted-foreground)]">{props.footer}</div>}
    </div>
  );
}

// Badge simples
function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'success' | 'danger' | 'info' }) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide';
  const tones: Record<string, string> = {
    default: 'bg-white text-gray-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20'
  };
  return <span className={cx(base, tones[tone])}>{children}</span>;
}

export default function Resultado() {
  const [   eventData, setEventData] = useState<StoredEventData | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  // Forecast carregada do sessionStorage (pre-fetch no formulário)
  const [forecast, setForecast] = useState<NormalizedForecast | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Carrega dados do sessionStorage (eventData + forecastData)
  useEffect(() => {
    const raw = sessionStorage.getItem('eventData') || sessionStorage.getItem('locationData');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (isStoredEventData(parsed)) setEventData(parsed);
      } catch { /* noop */ }
    }
    // Forecast
    try {
      const fRaw = sessionStorage.getItem('forecastData');
      if (fRaw) {
        const fParsed = JSON.parse(fRaw);
        if (fParsed && typeof fParsed === 'object' && 'metrics' in fParsed) {
          const normalized = fParsed as NormalizedForecast;
          setForecast(normalized);
          // Inicializa métrica priorizando ordem conhecida
          const order = ['temperature','rain','humidity','wind_speed','water_vapor'];
          const keys = Object.keys(normalized.metrics || {});
          const first = order.find(o => keys.includes(o)) || keys[0] || null;
          if (first) setSelectedMetric(first);
        }
      }
    } catch { /* ignore forecast parse errors */ }
    setMounted(true);
  }, []);

  const displayDate = useMemo(() => {
    if (!eventData?.form?.date) return '—';
    const iso = eventData.form.hour ? `${eventData.form.date}T${eventData.form.hour}:00` : `${eventData.form.date}T00:00:00`;
    try { return new Date(iso).toLocaleString(); } catch { return eventData.form.date; }
  }, [eventData]);

  // apiDateTime removido (era usado apenas para chamada de forecast) 

  // Efeito de carregamento de forecast removido - será reintroduzido lendo do storage

  async function handleExplain() {
    if (!eventData) return;
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
      const res = await fetch('/api/ai/explain-weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const ct = res.headers.get('content-type') || '';
      const raw = await res.text();
      if (!ct.includes('application/json')) {
        if (res.ok) setExplanation(raw || 'Resposta vazia.'); else throw new Error(`Erro não-JSON: ${res.status}`);
      } else {
        let data: ExplainResponse;
  try { data = JSON.parse(raw); } catch { throw new Error('JSON inválido'); }
        if (!res.ok || data.ok === false) throw new Error(data.error || data.details || 'Erro na API');
        const txt = data.explanation || data.choices?.[0]?.message?.content || 'Sem resposta da IA';
        setExplanation(txt);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro inesperado');
    } finally { setLoadingExplain(false); }
  }

  // Skeleton cards (exibição inicial)
  const loadingUI = (
    <div className="grid gap-4 md:grid-cols-6 auto-rows-[140px] mb-10">
      <Skeleton className="md:col-span-2" />
      <Skeleton className="md:col-span-2" />
      <Skeleton className="md:col-span-2" />
      <Skeleton className="md:col-span-3 row-span-2" />
      <Skeleton className="md:col-span-3 row-span-2" />
    </div>
  );

  function MetricCard({ name, metric }: { name: string; metric: ForecastMetric }) {
    const title = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const [lo, hi] = metric.interval_90;
    const series = Array.isArray(metric.series) ? metric.series : [];
    const unit = metric.unit || '';
    return (
      <Card title={title} className="flex flex-col justify-between">
        <div className="space-y-2">
          <p className="text-3xl font-bold tracking-tight">{formatNumber(metric.predicted)}{unit}</p>
          <p className="text-xs text-[var(--muted-foreground)]">Intervalo 90%: {formatNumber(lo)} – {formatNumber(hi)}{unit}</p>
          {series.length >= 4 && (
            <MiniSparkline values={series as number[]} />
          )}
        </div>
        <div className="pt-2 text-[10px] text-[var(--muted-foreground)] flex gap-2 flex-wrap">
          {metric.probabilities && Object.keys(metric.probabilities).slice(0,4).map(k => (
            <Badge key={k} tone="info">{k}: {Math.round(metric.probabilities![k]*100)}%</Badge>
          ))}
        </div>
      </Card>
    );
  }

  function formatNumber(n: number) {
    if (Math.abs(n) < 0.000001) return n.toExponential(2);
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
  }

  function MiniSparkline({ values }: { values: number[] }) {
    if (values.length < 4) return null;
    const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
    const pts = values.map((v,i) => `${(i/(values.length-1)*100).toFixed(2)},${(100-((v-min)/range)*100).toFixed(2)}`).join(' ');
    return (
      <svg viewBox="0 0 100 100" className="h-16 w-full">
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeOpacity={0.25} strokeWidth={6} />
      </svg>
    );
  }

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

      {mounted && (
        <section className="mb-12 space-y-6">
          {/* loadingForecast removido nesta fase; exibição condicional simplificada */}
          {forecast && (
            <>
              <div className="flex flex-wrap gap-3 items-center">
                {Object.keys(forecast.metrics).map(key => {
                  const active = key === selectedMetric;
                  return (
                    <label key={key} className={cx('cursor-pointer select-none text-xs font-medium px-3 py-1.5 rounded border flex items-center gap-2 transition',
                      active ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow' : 'bg-[var(--background-secondary)] border-[var(--border)] hover:border-[var(--accent)]/60')
                    }>
                      <input
                        type="radio"
                        name="metric"
                        value={key}
                        className="hidden"
                        checked={active}
                        onChange={() => setSelectedMetric(key)}
                      />
                      <span>{key.replace(/_/g,' ')}</span>
                    </label>
                  );
                })}
              </div>
              <div className="grid gap-4 md:grid-cols-6 auto-rows-[200px]">
                <Card title="Mapa" className="md:col-span-3 row-span-2 flex items-center justify-center">
                  <div className="text-center text-xs text-[var(--muted-foreground)]">(Mapa / futuro)</div>
                </Card>
                {selectedMetric && forecast.metrics[selectedMetric] && (
                  <div className="md:col-span-3 col-span-3">
                    <MetricCard name={selectedMetric} metric={forecast.metrics[selectedMetric]} />
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <section className="mb-12">
          {forecast && selectedMetric && (
          <Card title="Distribuições & Gráficos" footer="Gráficos reais serão integrados quando a API estiver ativa.">
            <div className="h-40 w-full rounded bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center text-xs text-[var(--muted-foreground)]">
              (Placeholder do gráfico – métrica: {selectedMetric.replace(/_/g,' ')})
            </div>
          </Card>
        )}
      </section>

      <section className="mb-16 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleExplain}
            disabled={loadingExplain || !eventData}
            className={cx('relative inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800')}
          >
            {loadingExplain && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {loadingExplain ? 'Gerando explicação...' : 'Explicar com IA'}
          </button>
          {!eventData && <p className="text-xs text-rose-500">Nenhum dado carregado ainda.</p>}
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>

        {explanation && (
          <Card title="Explicação da IA" className="prose max-w-none dark:prose-invert">
            <div className="prose-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: explanation }} />
          </Card>
        )}
      </section>

      <footer className="pb-10 text-center text-[10px] text-[var(--muted-foreground)]">
        Interface protótipo • Hackathon NASA 2025 • Ajustes visuais pendentes da API real
      </footer>
    </main>
  );
}
