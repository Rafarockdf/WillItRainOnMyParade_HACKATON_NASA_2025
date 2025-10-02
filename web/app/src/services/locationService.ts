export interface GeocodeInput {
  cidade?: string;
  pais?: string;
  numero?: string;
  rua?: string;
  codigoPostal?: string;
  rawAddress?: string; // endereço completo opcional
}

export interface GeocodeResult {
  address: string;
  data: unknown; 
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
  const data = await res.json();
  return { address, data };
}
