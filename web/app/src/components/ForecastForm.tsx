"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { SignUpSchema, signUpSchema } from '@/app/_schemas/auth-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Hash, Globe2, Calendar, Clock, Home, Building2, LocateFixed, CheckCircle2, AlertCircle } from 'lucide-react';
import { AnimatedButton } from '@/components/AnimatedButton';
import clsx from 'clsx';

// (Removed unused cx helper after integrating AnimatedButton)

interface EventDataStored {
	form: { cidade: string; rua: string; numero: string; cep: string; pais: string; estado: string; date: string; hour: string; };
	location?: { lat?: number; lng?: number; formattedAddress?: string };
	savedAt: number;
}

export interface ForecastFormProps {
	onSuccess?: (data: EventDataStored) => void;
	className?: string;
	compact?: boolean;
}

export function ForecastForm({ onSuccess, className }: ForecastFormProps) {
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const { register, handleSubmit, formState: { errors, touchedFields }, watch, reset } = useForm<SignUpSchema>({ resolver: zodResolver(signUpSchema), mode: 'onBlur' });

	// Progress calculation
	const values = watch();
	const totalFields = 8; // keep in sync with schema
	const filled = useMemo(() => Object.values(values || {}).filter(v => (v ?? '').toString().trim().length > 0).length, [values]);

	// Debounced autosave (300ms) of partial form values into existing eventData.form
	const debounceRef = useRef<number | null>(null);
	useEffect(() => {
		if (!values) return;
		if (debounceRef.current) window.clearTimeout(debounceRef.current);
		debounceRef.current = window.setTimeout(() => {
			try {
				const raw = sessionStorage.getItem('eventData');
				let existing: EventDataStored | null = null;
				if (raw) {
					existing = JSON.parse(raw);
				}
				const merged: EventDataStored = {
					form: {
						cidade: values.cidade || existing?.form.cidade || '',
						rua: values.rua || existing?.form.rua || '',
						numero: values.numero || existing?.form.numero || '',
						cep: values.cep || existing?.form.cep || '',
						pais: values.pais || existing?.form.pais || '',
						estado: values.estado || existing?.form.estado || '',
						date: values.date || existing?.form.date || '',
						hour: values.hour || existing?.form.hour || ''
					},
					location: existing?.location,
					savedAt: Date.now()
				};
				sessionStorage.setItem('eventData', JSON.stringify(merged));
			} catch { /* ignore autosave errors */ }
		}, 300);
		return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
	}, [values]);

	async function onSubmit(payload: SignUpSchema) {
		setSubmitting(true);
		setSubmitError(null);
		const geocodeBody = {
			cidade: payload.cidade,
			rua: payload.rua,
			numero: payload.numero,
			codigoPostal: payload.cep,
			pais: payload.pais,
			estado: payload.estado,
		};
		try {
			const res = await fetch('/api/geocode', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(geocodeBody)
			});
			if (!res.ok) throw new Error(`Erro geocode (${res.status})`);
			const geoJson = await res.json();
			const eventData: EventDataStored = {
				form: { cidade: payload.cidade, rua: payload.rua, numero: payload.numero, cep: payload.cep, pais: payload.pais, estado: payload.estado, date: payload.date, hour: payload.hour },
				location: { lat: geoJson?.lat, lng: geoJson?.lng, formattedAddress: geoJson?.address },
				savedAt: Date.now()
			};
			sessionStorage.setItem('eventData', JSON.stringify(eventData));
			onSuccess?.(eventData);
		} catch (e: unknown) {
			setSubmitError(e instanceof Error ? e.message : 'Erro inesperado');
		} finally { setSubmitting(false); }
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} noValidate className={clsx('group mx-auto flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-[var(--background)]/90 shadow-xl backdrop-blur-md dark:border-white/10', className)}>
			<div className="relative flex flex-col gap-6 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-sky-600/30 hover:scrollbar-thumb-sky-600/50">
				<div className="flex items-center justify-between gap-4">
					<p className="max-w-md text-left text-sm font-medium text-[var(--foreground)]/90">Enter your event location and time to check upcoming weather risk.</p>
					<div className="flex flex-col items-end">
						<span className="text-[10px] font-medium tracking-wide text-[var(--muted-foreground)]">Progress</span>
						<div className="mt-1 flex items-center gap-2">
							<div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
								<div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-fuchsia-600 transition-all" style={{ width: `${Math.max(8, (filled/totalFields)*100)}%` }} />
							</div>
							<span className="text-[10px] font-semibold text-[var(--foreground)]/70">{filled}/{totalFields}</span>
						</div>
					</div>
				</div>

				<div className="grid gap-5 sm:grid-cols-2">
					<Field label="City" icon={Building2} name="cidade" error={errors.cidade?.message} isTouched={!!touchedFields.cidade}>
						<input id="cidade" placeholder="City" {...register('cidade')} aria-invalid={!!errors.cidade} />
					</Field>
					<Field label="Street" icon={Home} name="rua" error={errors.rua?.message} isTouched={!!touchedFields.rua}>
						<input id="rua" placeholder="Street" {...register('rua')} aria-invalid={!!errors.rua} />
					</Field>
					<Field label="Number" icon={Hash} name="numero" error={errors.numero?.message} isTouched={!!touchedFields.numero}>
						<input id="numero" placeholder="Number" {...register('numero')} aria-invalid={!!errors.numero} />
					</Field>
					<Field label="State" icon={MapPin} name="estado" error={errors.estado?.message} isTouched={!!touchedFields.estado}>
						<input id="estado" placeholder="State" {...register('estado')} aria-invalid={!!errors.estado} />
					</Field>
					<Field label="ZIP" icon={LocateFixed} name="cep" error={errors.cep?.message} isTouched={!!touchedFields.cep}>
						<input
							id="cep"
							placeholder="ZIP"
							{...register('cep')}
							aria-invalid={!!errors.cep}
							maxLength={9}
							inputMode="numeric"
							onChange={(e) => {
								const raw = e.target.value.replace(/\D/g, '').slice(0,8);
								let masked = raw;
								if (raw.length > 5) masked = raw.slice(0,5) + '-' + raw.slice(5);
								e.target.value = masked;
							}}
						/>
					</Field>
					<Field label="Country" icon={Globe2} name="pais" error={errors.pais?.message} isTouched={!!touchedFields.pais}>
						<input id="pais" placeholder="Country" {...register('pais')} aria-invalid={!!errors.pais} />
					</Field>
					<Field label="Date" icon={Calendar} name="date" error={errors.date?.message} isTouched={!!touchedFields.date}>
						<input id="date" type="date" placeholder="Date" {...register('date')} aria-invalid={!!errors.date} />
					</Field>
					<Field label="Time" icon={Clock} name="hour" error={errors.hour?.message} isTouched={!!touchedFields.hour}>
						<input id="hour" type="time" placeholder="Time" {...register('hour')} aria-invalid={!!errors.hour} />
					</Field>
				</div>

				{submitError && <p className="text-xs font-medium text-rose-500">{submitError}</p>}
			</div>

			<div className="border-t border-white/10 bg-gradient-to-r from-transparent via-white/5 to-transparent px-6 py-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<div className="flex w-full gap-2">
						<button
							type="button"
							onClick={() => {
								reset();
								try { sessionStorage.removeItem('eventData'); } catch {}
							}}
							className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-[var(--foreground)]/80 backdrop-blur hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400"
						>
							Clear
						</button>
						<button
							type="button"
							onClick={() => {
								const sample: SignUpSchema = {
									cidade: 'São Paulo',
									rua: 'Avenida Paulista',
									numero: '1000',
									cep: '01310-100',
									pais: 'Brasil',
									estado: 'SP',
									date: new Date().toISOString().slice(0,10),
									hour: '18:00'
								};
								reset(sample);
							}}
							className="inline-flex flex-1 items-center justify-center rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-600 backdrop-blur hover:bg-sky-500/20 dark:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
						>
							Sample
						</button>
					</div>
					<AnimatedButton
						label="Check forecast"
						disabled={submitting}
						onAction={async () => {
							const data = values as SignUpSchema; // current form snapshot
							await onSubmit(data);
						}}
					/>
				</div>
				<p className="mt-2 text-center text-[10px] text-[var(--muted-foreground)]">Prototype • NASA Hackathon</p>
			</div>

			<style jsx>{`
				.input-base { @apply w-full rounded-xl border border-gray-300/70 bg-white/90 px-3 pr-10 text-sm text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-400 dark:bg-zinc-900/60 dark:border-zinc-700 dark:placeholder:text-zinc-500 dark:focus:border-sky-400 dark:focus:ring-sky-500; }
				.dark .input-base { @apply focus:border-sky-400 focus:ring-sky-500; }
				.field-icon { @apply pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors; }
				.field-root[data-status='error'] .input-base { @apply border-rose-500/70 focus:border-rose-500 focus:ring-rose-400; }
				.field-root[data-status='success'] .input-base { @apply border-emerald-500/60 focus:border-emerald-500 focus:ring-emerald-400; }
				.field-root[data-status='error'] .field-icon-main { @apply text-rose-500; }
				.field-root[data-status='success'] .field-icon-main { @apply text-emerald-500; }
				.scrollbar-thin { scrollbar-width: thin; }
				.scrollbar-thin::-webkit-scrollbar { width: 6px; }
				.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
				.scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(56,178,248,0.3); border-radius: 9999px; }
				.scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(56,178,248,0.55); }
			`}</style>
		</form>
	);
}

interface FieldProps {
	children: React.ReactNode;
	label: string;
	name: string;
	error?: string;
	isTouched?: boolean;
	icon?: React.ComponentType<{ className?: string }>;
}

function Field({ children, label, error, icon: Icon, isTouched }: FieldProps) {
	const hasError = !!error;
	const status: 'idle' | 'error' | 'success' = hasError ? 'error' : (isTouched ? 'success' : 'idle');
	return (
		<label className="field-root relative block" data-status={status}>
			<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">{label}</span>
			<div className="relative">
				{children}
				{Icon && <Icon className={clsx('field-icon field-icon-main h-4 w-4', status === 'idle' && 'text-gray-400/70')} />}
				{status === 'error' && <AlertCircle className="field-icon h-4 w-4 right-8 text-rose-500" aria-hidden />}
				{status === 'success' && <CheckCircle2 className="field-icon h-4 w-4 right-8 text-emerald-500" aria-hidden />}
			</div>
			{hasError && <span className="mt-1 block text-[11px] font-medium text-rose-500" role="alert">{error}</span>}
		</label>
	);
}

export default ForecastForm;
