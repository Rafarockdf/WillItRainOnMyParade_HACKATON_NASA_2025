import { NextRequest } from 'next/server';
import { normalizeForecast, RawForecastAPIResponse } from '../../../../types/forecast';
import { headers } from 'next/headers';

// Pequeno mock fallback reutilizando shape simplificado caso backend indisponível.
// (Poderíamos importar de forecastService, mas mantemos desacoplado para evitar dependência cruzada client/server.)
const FALLBACK: RawForecastAPIResponse = {
  data: {
    forecast: {
      temperature: { predicted: 25, interval_90: [20, 30], series: [25, 26, 27, 26, 25, 24], unit: '°C' },
      rain: { predicted: 0.001, interval_90: [0, 0.003], series: [0, 0.0005, 0.001, 0.0015, 0.0008, 0], unit: 'mm' },
    },
    location: { lat: 0, lon: 0 },
    timestamp: new Date().toISOString().replace('T', ' ').slice(0,19),
  },
  status: 'mock'
};

interface ForecastRequestBody {
  lat?: number; lon?: number; lng?: number; datetime?: string; date?: string; hour?: string;
}

function pickNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v.trim());
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function buildDateTime(body: ForecastRequestBody): string | undefined {
  if (body.datetime && typeof body.datetime === 'string') return body.datetime;
  if (body.date && body.hour) return `${body.date} ${body.hour}:00`;
  return undefined;
}

export async function POST(req: NextRequest) {
  const h = await headers();
  console.log('[POST /api/forecast] request-id:', h.get('x-request-id'));
  let body: ForecastRequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // Latitude: só aceita 'lat'
  const lat = pickNumber(body.lat);
  // Longitude: aceita 'lon' ou 'lng'
  const lon = pickNumber(body.lon ?? body.lng);
  const datetime = buildDateTime(body);

  if (lat == null || lon == null) {
    return Response.json({ error: 'lat e lon/lng são obrigatórios' }, { status: 422 });
  }
  if (!datetime) {
    return Response.json({ error: 'datetime (ou date + hour) é obrigatório' }, { status: 422 });
  }

  const base = process.env.FORECAST_API_BASE_URL;
  if (!base) {
    console.warn('FORECAST_API_BASE_URL ausente. Retornando fallback MOCK.');
    return Response.json(normalizeForecast({ ...FALLBACK, data: { ...FALLBACK.data, location: { lat, lon }, timestamp: datetime } }));
  }

  try {
    // Se a base já aponta para um endpoint específico (ex: termina com /collect ou /forecast ou /predict), não concatenar.
    // Caso contrário, assumimos que devemos anexar /forecast.
    const lowered = base.toLowerCase();
    const endsWithEndpoint = /(collect|forecast|predict)(\/)?$/.test(lowered);
    const url = new URL(endsWithEndpoint ? base : base.replace(/\/$/, '') + '/forecast');
    console.log('[forecast-proxy] base="' + base + '" finalUrl="' + url.toString() + '" datetime="' + datetime + '" lat=' + lat + ' lon=' + lon);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon, datetime })
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Backend forecast error status', res.status, text);
      return Response.json({ error: 'Falha backend forecast', status: res.status }, { status: 502 });
    }
    const json: unknown = await res.json();
    if (!json || typeof json !== 'object' || !('data' in json)) {
      return Response.json({ error: 'Formato inesperado do backend' }, { status: 502 });
    }
    const normalized = normalizeForecast(json as RawForecastAPIResponse);
    return Response.json(normalized, { status: 200 });
  } catch (e: unknown) {
    console.error('Erro ao contactar backend forecast:', e);
    return Response.json(normalizeForecast({ ...FALLBACK, data: { ...FALLBACK.data, location: { lat, lon }, timestamp: datetime } }), { status: 200, statusText: 'mock-fallback' });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';