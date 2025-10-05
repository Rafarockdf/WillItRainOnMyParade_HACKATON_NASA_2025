"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'motion/react';

/**
 * SimpleAnimatedButton
 * Estados: idle -> loading -> (success | error) -> (auto reset para idle)
 * Props:
 *  - label: texto padrão
 *  - onAction: função async (retorne Promise). Se resolve => success, se rejeita => error
 *  - autoResetMs: tempo para voltar ao estado idle após success/error (default 1800ms)
 *  - disabled: desabilita interação
 */
export interface SimpleAnimatedButtonProps {
	label: string;
	onAction?: () => Promise<unknown> | void;
	autoResetMs?: number;
	className?: string;
	disabled?: boolean;
	id?: string;
	title?: string;
	state?: BtnState; // external control (overrides internal if provided)
	onSuccess?: () => void;
	onError?: (message?: string) => void;
}

type BtnState = 'idle' | 'loading' | 'success' | 'error';

export const AnimatedButton: React.FC<SimpleAnimatedButtonProps> = ({ label, onAction, autoResetMs = 1800, disabled, className, id, title, state: externalState, onSuccess, onError }) => {
	const [internalState, setInternalState] = useState<BtnState>('idle');
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const state = externalState ?? internalState;

	// Auto reset when success or error
	useEffect(() => {
		if (externalState) return; // when controlled, skip auto reset
		if (state === 'success' || state === 'error') {
			const t = setTimeout(() => {
				setInternalState('idle');
				setErrorMessage(null);
			}, autoResetMs);
			return () => clearTimeout(t);
		}
	}, [state, autoResetMs, externalState]);

	const handleClick = useCallback(async () => {
		if (disabled || state === 'loading') return;
		if (!onAction) return;
		try {
			setErrorMessage(null);
			if (!externalState) setInternalState('loading');
			await onAction();
			if (!externalState) setInternalState('success');
			onSuccess?.();
		} catch (e: unknown) {
			const msg = (e as Error)?.message ?? 'Erro';
			setErrorMessage(msg);
			if (!externalState) setInternalState('error');
			onError?.(msg);
		}
	}, [onAction, disabled, state, externalState, onSuccess, onError]);

	const colors: Record<BtnState, string> = {
		idle: 'bg-gradient-to-r from-sky-600 via-fuchsia-600 to-violet-600 hover:brightness-110 text-white',
		loading: 'bg-gray-400 text-white cursor-wait',
		success: 'bg-emerald-600 text-white',
		error: 'bg-rose-600 text-white'
	};

	const labelByState: Record<BtnState, React.ReactNode> = {
		idle: label,
		loading: <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processando...</span>,
		success: <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Sucesso</span>,
		error: <span className="inline-flex items-center gap-2"><XCircle className="h-4 w-4" /> {errorMessage || 'Erro'}</span>
	};

	return (
		<div className="flex flex-col items-stretch">
							<motion.button
								id={id}
								title={title}
								type="button"
								whileTap={state === 'idle' ? { scale: 0.95 } : undefined}
								whileHover={state === 'idle' ? { y: -2 } : undefined}
								disabled={disabled || state === 'loading'}
								onClick={handleClick}
								aria-busy={state === 'loading'}
								aria-disabled={disabled || state === 'loading'}
								className={clsx(
									'relative inline-flex h-11 select-none items-center justify-center rounded-xl px-6 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 disabled:opacity-60',
									colors[state],
									className
								)}
							>
				{/* Animated background sheen on idle */}
						{state === 'idle' && (
							<span className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300" style={{ background: 'linear-gradient(120deg,rgba(255,255,255,0.25),transparent 70%)' }} />
						)}
				{labelByState[state]}
			</motion.button>
			{state === 'error' && errorMessage && (
				<p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{errorMessage}</p>
			)}
		</div>
	);
};

export default AnimatedButton;