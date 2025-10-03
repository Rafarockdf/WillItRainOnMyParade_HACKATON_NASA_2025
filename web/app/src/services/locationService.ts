export interface GeocodeInput {
  cidade?: string;
  pais?: string;
  numero?: string;
  rua?: string;
  codigoPostal?: string;
  rawAddress?: string;
}

export interface GeocodeAPIResultItem {
  formatted_address?: string;
  geometry?: {
    location?: { lat?: number; lng?: number };
  };
  [k: string]: unknown;
}

export interface GeocodeAPIResult {
  status: string;
  results?: GeocodeAPIResultItem[]; 
  result?: GeocodeAPIResultItem[];  
  data?: { results?: GeocodeAPIResultItem[]; result?: GeocodeAPIResultItem[] };
  [k: string]: unknown;
}

export interface GeocodeResult {
  address: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  raw: GeocodeAPIResult;
}

function buildAddress({ cidade, pais, numero, rua, codigoPostal, rawAddress }: GeocodeInput): string {
  if (rawAddress) return rawAddress.trim();
  const parts = [
    numero && rua ? `${numero} ${rua}` : rua,
    cidade,
    codigoPostal,
    pais,
  ].filter(Boolean);
  if (!parts.length) throw new Error("Nenhuma parte de endereço fornecida");
  return parts.join(", ");
}

export async function geocodeAddress(input: GeocodeInput): Promise<GeocodeResult> {
  const address = buildAddress(input);
  const apiKey = process.env.DISTANCE_MATRIX_KEY;
  if (!apiKey) throw new Error("DISTANCE_MATRIX_KEY não definida (.env.local)");

  const url = new URL("https://api.distancematrix.ai/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Falha geocode (${res.status})`);
  const data: GeocodeAPIResult = await res.json();

  // Fallback: unificar possíveis arrays
  const candidates = data.results
    ?? data.result
    ?? data.data?.results
    ?? data.data?.result
    ?? [];

  const first = Array.isArray(candidates) ? candidates[0] : undefined;
  const lat = first?.geometry?.location?.lat;
  const lng = first?.geometry?.location?.lng;

  // DEBUG (remover depois)
  console.log("[geocodeAddress] status:", data.status, "items:", Array.isArray(candidates) ? candidates.length : 0, "lat?", lat, "lng?", lng);

  return {
    address,
    formattedAddress: first?.formatted_address,
    lat,
    lng,
    raw: data,
  };
}