'use client';
import React from 'react';
import { cx } from '../../lib/cx';

type Tone = 'default' | 'success' | 'danger' | 'info';

export function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: Tone }) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide';
  const tones: Record<Tone, string> = {
    default: 'bg-white text-gray-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20'
  };
  return <span className={cx(base, tones[tone])}>{children}</span>;
}
