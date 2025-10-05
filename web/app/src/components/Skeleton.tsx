'use client';
import React from 'react';
import { cx } from '../lib/cx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded bg-[var(--muted)]/40', className)} />;
}
