"use client";
import { useState } from "react";

interface FormState {
	rawAddress: string;
	rua: string;
	numero: string;
	cidade: string;
	codigoPostal: string;
	pais: string;
}

interface ApiSuccess {
	lat: number;
	lng: number;
	address: string;
}

interface ApiError {
	error: string;
	[k: string]: unknown;
}

type ApiResult = ApiSuccess | ApiError;

const initialState: FormState = {
	rawAddress: "",
	rua: "",
	numero: "",
	cidade: "",
	codigoPostal: "",
	pais: "",
};

function isSuccess(r: ApiResult | null): r is ApiSuccess {
	return !!r && (r as ApiSuccess).lat !== undefined && (r as ApiSuccess).lng !== undefined && !(r as ApiError).error;
}

export default function ForecastForm() {
	const [form, setForm] = useState<FormState>(initialState);
	const [result, setResult] = useState<ApiResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function onChange(e: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = e.target;
		setForm(f => ({ ...f, [name]: value }));
	}

	function buildPayload() {
		// Se rawAddress preenchido, envia só ele
		if (form.rawAddress.trim()) {
			return { rawAddress: form.rawAddress.trim() };
		}
		// Caso contrário coleta campos não vazios
		const payload: Record<string, string> = {};
		if (form.rua.trim()) payload.rua = form.rua.trim();
		if (form.numero.trim()) payload.numero = form.numero.trim();
		if (form.cidade.trim()) payload.cidade = form.cidade.trim();
		if (form.codigoPostal.trim()) payload.codigoPostal = form.codigoPostal.trim();
		if (form.pais.trim()) payload.pais = form.pais.trim();
		return payload;
	}

	function validatePayload(payload: Record<string, unknown>) {
		if (payload.rawAddress) return;
		const min = [payload.cidade, payload.pais].filter(Boolean).length;
		if (min < 2) {
			throw new Error("Informe endereço completo OU ao menos cidade e país");
		}
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setResult(null);
		const payload = buildPayload();
		try {
			validatePayload(payload);
		} catch (err) {
			setError((err as Error).message);
			return;
		}
		setLoading(true);
		try {
			const res = await fetch("/api/geocode", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = (await res.json()) as ApiResult;
			if (!res.ok) {
				setError((json as ApiError).error || `Erro ${res.status}`);
			}
			setResult(json);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoading(false);
		}
	}

	function clearAll() {
		setForm(initialState);
		setResult(null);
		setError(null);
	}

	return (
		<div className="space-y-6">
			<form onSubmit={onSubmit} className="space-y-4 p-5 rounded-lg border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] bg-[var(--background)]/60 backdrop-blur-md">
				<fieldset className="space-y-2">
					<label className="block text-sm font-medium">Endereço completo (opcional)</label>
					<input
						name="rawAddress"
						value={form.rawAddress}
						onChange={onChange}
						placeholder="Ex: Avenida Paulista 1000, São Paulo, Brasil"
						className="w-full rounded border px-3 py-2 bg-[var(--background)]"
					/>
					<p className="text-xs text-[var(--muted-foreground)]">Se preencher, os campos abaixo são ignorados.</p>
				</fieldset>
				<div className="grid md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium">Rua</label>
						<input name="rua" value={form.rua} onChange={onChange} className="w-full rounded border px-3 py-2 bg-[var(--background)]" />
					</div>
						<div>
						<label className="block text-sm font-medium">Número</label>
						<input name="numero" value={form.numero} onChange={onChange} className="w-full rounded border px-3 py-2 bg-[var(--background)]" />
					</div>
					<div>
						<label className="block text-sm font-medium">Cidade *</label>
						<input name="cidade" value={form.cidade} onChange={onChange} className="w-full rounded border px-3 py-2 bg-[var(--background)]" />
					</div>
					<div>
						<label className="block text-sm font-medium">CEP</label>
						<input name="codigoPostal" value={form.codigoPostal} onChange={onChange} className="w-full rounded border px-3 py-2 bg-[var(--background)]" />
					</div>
					<div className="md:col-span-2">
						<label className="block text-sm font-medium">País *</label>
						<input name="pais" value={form.pais} onChange={onChange} className="w-full rounded border px-3 py-2 bg-[var(--background)]" />
					</div>
				</div>
				<div className="flex gap-2">
					<button type="submit" disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
						{loading ? "Buscando..." : "Geocodificar"}
					</button>
					<button type="button" onClick={clearAll} className="px-4 py-2 rounded border">
						Limpar
					</button>
				</div>
				<p className="text-xs text-[var(--muted-foreground)]">* Campos obrigatórios se não usar endereço completo.</p>
			</form>
			{error && (
				<div className="p-4 rounded border border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200">
					Erro: {error}
				</div>
			)}
			{isSuccess(result) && (
				<div className="p-4 rounded border bg-[var(--background)]/60 backdrop-blur">
					<h2 className="font-semibold mb-2">Coordenadas</h2>
					<p className="text-sm mb-1"><span className="font-medium">Endereço:</span> {result.address}</p>
					<p className="font-mono text-sm">Lat: {result.lat} | Lng: {result.lng}</p>
				</div>
			)}
			{!isSuccess(result) && result && 'error' in result && (
				<div className="p-4 rounded border bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
					{result.error}
				</div>
			)}
		</div>
	);
}
