'use client';
import React from 'react';
import type { ForecastMetric } from '../../../types/forecast';
import { metricIcon, metricLabels } from './metricsConfig';
import { Info } from 'lucide-react';
import { MiniSparkline } from './MiniSparkline';

function formatNumber(n: number) {
  if (Math.abs(n) < 0.000001) return n.toExponential(2);
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

export function DetailedMetric({ name, metric }: { name: string; metric: ForecastMetric }) {
  const label = metricLabels[name] || name.replace(/_/g,' ');
  const [lo, hi] = metric.interval_90;
  const unit = metric.unit || '';
  let series: number[] = [];
  if (Array.isArray(metric.series)) {
    series = metric.series as number[];
  } else if (
    metric.series &&
    typeof metric.series === 'object' &&
    Array.isArray((metric.series as any).values)
  ) {
    series = (metric.series as any).values as number[];
  }
  const avgSafe = series.length > 0 ? series.reduce((a, b) => a + b, 0) / series.length : undefined;
  const min = series.length ? Math.min(...series) : metric.interval_90[0];
  const max = series.length ? Math.max(...series) : metric.interval_90[1];
  const statItems = [
    { k: 'Probability', v: `95%` },
    { k: 'Mín', v: `${formatNumber(min)}${unit}` },
    { k: 'Máx', v: `${formatNumber(max)}${unit}` },
    { k: 'Avarage', v: avgSafe !== undefined ? `${formatNumber(avgSafe)}${unit}` : '-' }
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/60 p-6 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
              {metricIcon[name] || metricIcon._default || <Info className="h-5 w-5" />}{label}
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold leading-none tracking-tight select-text">{formatNumber(metric.predicted)}{unit}</span>
              <span className="text-[11px] font-medium text-[var(--muted-foreground)] whitespace-nowrap">Interval 95%: {formatNumber(lo)}–{formatNumber(hi)}{unit}</span>
            </div>
          </div>
          {series.length >= 4 && (
            <div className="w-full sm:w-auto sm:min-w-[220px] flex-1">
              <MiniSparkline values={series} />
            </div>
          )}
        </div>
        <div className="grid w-full grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {statItems.map(item => (
            <div key={item.k} className="relative rounded-lg border border-[var(--border)] bg-[var(--background)]/50 p-2.5 backdrop-blur-sm group/stat transition hover:shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] group-hover/stat:text-[var(--foreground)]/80">{item.k}</span>
              <span className="mt-0.5 block text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight">{item.v}</span>
              <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover/stat:opacity-100 transition bg-gradient-to-br from-[var(--accent)]/10 to-transparent" />
            </div>
          ))}
        </div>
        {metric.probabilities && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(metric.probabilities).slice(0,6).map(([k,v]) => (
              <span key={k} className="rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 px-2 py-0.5 text-[10px] font-medium">
                {k}: {Math.round(v*100)}%
              </span>
            ))}
          </div>
        )}
        <div className="pt-2 text-[10px] text-[var(--muted-foreground)]">Dados simulados podem diferir dos valores finais da API.</div>
      </div>
    </div>
  );
}
