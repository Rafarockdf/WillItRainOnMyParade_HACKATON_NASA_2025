'use client';
import React from 'react';
import { cx } from '../../lib/cx';

type CardProps = React.PropsWithChildren<{ title?: string; className?: string; footer?: React.ReactNode }>;

export function Card({ title, className, footer, children }: CardProps) {
  return (
    <div className={cx('group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/70 backdrop-blur-sm shadow-sm transition hover:shadow-md dark:shadow-none', className)}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-white/5 to-transparent" />
      <div className="p-4 sm:p-5">
        {title && <h3 className="mb-2 text-sm font-semibold tracking-wide text-[var(--foreground)]/80 uppercase">{title}</h3>}
        {children}
      </div>
      {footer && <div className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted-foreground)]">{footer}</div>}
    </div>
  );
}
