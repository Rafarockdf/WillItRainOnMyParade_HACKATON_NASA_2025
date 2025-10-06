"use client";
import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { NormalizedForecast } from '../../../types/forecast';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/Skeleton';
import { MetricSelector } from '../../components/forecast/MetricSelector';
import { DetailedMetric } from '../../components/forecast/DetailedMetric';
import { MiniSparkline } from '../../components/forecast/MiniSparkline';
import { cx } from '../../lib/cx';
import GraphLine from './graph_line';
import  ClassifyWeather  from './classify_weather';

import { DownloadIcon } from 'lucide-react';

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
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const handleDownload = () => {
    setShowDownloadModal(true);
  };

  const handleDownloadConfirm = async () => {
    try {
        const data = sessionStorage.getItem('forecastData');
        if (!data) throw new Error('No forecast data available for download.');
        const res = await fetch('/api/download', { method: 'POST', body: data });
        if (!res.ok) throw new Error(`Erro ao baixar: ${res.status}`);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'forecast-data.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setShowDownloadModal(false);
    } catch (error) {
        console.error('Erro ao baixar CSV:', error);
        setShowDownloadModal(false);
    }
  };

  const handleDownloadCancel = () => {
    setShowDownloadModal(false);
  };

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
    const fRaw = sessionStorage.getItem('forecastData');
    const payload = {
      lat: eventData.location?.lat,
      lng: eventData.location?.lng,
      address: eventData.location?.formattedAddress || eventData.location?.cidade,
      date: eventData.form?.date,
      hour: eventData.form?.hour,
      forecast: fRaw,
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
          <ClassifyWeather/>
          <p className="text-sm text-[var(--muted-foreground)]">AI-generated prediction & insight for your event.</p>
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
            <div className="flex flex-wrap items-center gap-2">
            <button
                onClick={handleDownload}
                className={cx(
                'relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition border backdrop-blur-sm',
                'bg-[var(--accent)] text-[var(--accent)] border-[var(--accent)] shadow hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[var(--accent)]'
              )}
            >
                <DownloadIcon className="h-4 w-4" />
            </button>
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
                ? 'Generating...' 
                : explanation 
                  ? (showExplanation ? 'Ocult Explanation' : 'Show Explanation')
                  : 'Explain With AI'
              }
            </button>
            </div>
          </div>
          {(!eventData || error) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {!eventData && <p className="text-rose-500">No data loaded yet.</p>}
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
          <Card title="Forecast throughout the day" footer="Atualmente apenas temperatura possui série completa; outras métricas exibirão placeholder.">
            <div className="h-60 w-full relative overflow-hidden rounded-lg flex items-center justify-center">
              {/* Chamada dinâmica do gráfico conforme a métrica selecionada */}
              {selectedMetric && (
                <GraphLine
                  key={selectedMetric}
                  metric={selectedMetric as any}
                  label={selectedMetric === 'temperature' ? 'Temperature' : selectedMetric === 'humidity' ? 'Humidity' : selectedMetric === 'rain' ? 'Rain' : selectedMetric === 'wind_speed' ? 'Wind' : selectedMetric === 'water_vapor' ? 'Water Vapor' : selectedMetric}
                  unit={selectedMetric === 'temperature' ? '°C' : selectedMetric === 'humidity' ? '%' : selectedMetric === 'rain' ? 'mm/h' : selectedMetric === 'wind_speed' ? 'km/h' : selectedMetric === 'water_vapor' ? 'mm' : ''}
                />
              )}
            </div>
          </Card>
        )}
      </section>

      <footer className="pb-10 text-center text-[10px] text-[var(--muted-foreground)]">
        Interface protótipo • Hackathon NASA 2025 • Ajustes visuais pendentes da API real
      </footer>

      {/* Modal de Confirmação de Download */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Confirm Download
            </h3>
            <div className="space-y-3 mb-6 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-medium">The file will contain:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>NASA (MERRA-2) variable data</li>
                <li>Weather forecasts for the event</li>
                <li>Location and date information</li>
                <li>Confidence metrics and ranges</li>
              </ul>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Format: CSV • Estimated size: ~10-50 KB
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDownloadCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                Dowload CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
