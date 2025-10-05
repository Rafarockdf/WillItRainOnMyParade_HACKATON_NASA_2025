'use client';
import React from 'react';
import type { ForecastMetric } from '../../../types/forecast';
import { metricIcon, metricLabels } from './metricsConfig';
import { Info } from 'lucide-react';
import { cx } from '../../lib/cx';

interface MetricSelectorProps { metrics: Record<string, ForecastMetric>; current: string | null; onSelect: (k: string)=>void; }

export function MetricSelector({ metrics, current, onSelect }: MetricSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.keys(metrics).map(k => {
        const active = k === current;
        return (
          <button
            key={k}
            onClick={() => onSelect(k)}
            className={cx('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition border backdrop-blur-sm',
              active ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow' : 'bg-[var(--background-secondary)]/70 border-[var(--border)] hover:border-[var(--accent)]/60')}
          >
            {metricIcon[k] || metricIcon._default || <Info className="h-4 w-4" />}
            <span>{metricLabels[k] || k.replace(/_/g,' ')}</span>
          </button>
        );
      })}
    </div>
  );
}
