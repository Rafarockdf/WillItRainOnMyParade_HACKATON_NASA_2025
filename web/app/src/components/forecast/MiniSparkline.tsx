'use client';
import React from 'react';

export function MiniSparkline({ values }: { values: number[] }) {
  if (!Array.isArray(values) || values.length < 4) return null;
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
  const pts = values.map((v,i) => `${(i/(values.length-1)*100).toFixed(2)},${(100-((v-min)/range)*100).toFixed(2)}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-full">
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeOpacity={0.25} strokeWidth={6} />
    </svg>
  );
}
