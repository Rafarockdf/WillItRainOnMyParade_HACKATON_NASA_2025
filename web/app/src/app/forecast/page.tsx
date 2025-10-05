'use client';
import { useEffect, useState, useMemo } from 'react';

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
  const [eventData, setEventData] = useState<StoredEventData | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Carrega dados do sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('eventData') || sessionStorage.getItem('locationData');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (isStoredEventData(parsed)) setEventData(parsed);
      } catch { /* noop */ }
    }
    setMounted(true);
  }, []);

  const displayDate = useMemo(() => {
    if (!eventData?.form?.date) return '—';
    const iso = eventData.form.hour ? `${eventData.form.date}T${eventData.form.hour}:00` : `${eventData.form.date}T00:00:00`;
    try { return new Date(iso).toLocaleString(); } catch { return eventData.form.date; }
  }, [eventData]);

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
        <section className="grid gap-4 md:grid-cols-6 auto-rows-[160px] mb-12">
          <Card title="Temperatura" className="md:col-span-2 flex flex-col justify-between">
            <div className="flex flex-col items-start">
              <span className="text-5xl font-bold leading-none">21ºC</span>
              <span className="mt-2 text-xs text-[var(--muted-foreground)]">Estimativa Atual</span>
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <Badge tone="success">Min 16ºC</Badge>
              <Badge tone="danger">Max 27ºC</Badge>
            </div>
          </Card>

          <Card title="Mapa" className="md:col-span-3 row-span-2 flex items-center justify-center">
            <div className="text-center text-xs text-[var(--muted-foreground)]">
              (Mapa ou visualização futura)
            </div>
          </Card>

            <Card title="Chuva" className="md:col-span-1 flex flex-col items-start justify-between">
              <div>
                <p className="text-3xl font-bold">-2mm</p>
                <p className="text-xs text-[var(--muted-foreground)]">Precipitação</p>
              </div>
              <Badge>Baixa</Badge>
            </Card>

            <Card title="Métrica Extra" className="md:col-span-1 flex flex-col items-start justify-between">
              <div>
                <p className="text-xl font-semibold">Median</p>
                <p className="text-xs text-[var(--muted-foreground)]">Valor de referência</p>
              </div>
              <Badge tone="info">P50</Badge>
            </Card>

            <Card title="Resumo" className="md:col-span-2 flex flex-col justify-between">
              <p className="text-sm leading-relaxed text-[var(--foreground)]/80">
                Esta área poderá mostrar um resumo rápido das métricas principais (temperatura, chuva, vento, umidade) com base no modelo.
              </p>
              <Badge tone="default">Modelo: beta</Badge>
            </Card>
        </section>
      )}

      <section className="mb-12">
        <Card title="Distribuições & Gráficos" footer="Gráficos reais serão integrados quando a API estiver ativa.">
          <div className="h-40 w-full rounded bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center text-xs text-[var(--muted-foreground)]">
            (Placeholder do gráfico)
          </div>
        </Card>
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
