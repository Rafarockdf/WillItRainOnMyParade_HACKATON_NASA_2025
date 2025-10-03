import { geocodeAddress } from "@/services/locationService";

type AnyRecord = Record<string, unknown>;

function normalizeInput(raw: AnyRecord) {
  // Aceita variações de nome vindas do form (cep, postalCode, estado->pais etc.)
  const input = {
    rawAddress: valueStr(raw.rawAddress),
    rua: valueStr(raw.rua) || valueStr(raw.street),
    numero: valueStr(raw.numero) || valueStr(raw.number),
    cidade: valueStr(raw.cidade) || valueStr(raw.city),
    codigoPostal: valueStr(raw.codigoPostal) || valueStr(raw.cep) || valueStr(raw.postalCode),
    pais: valueStr(raw.pais) || valueStr(raw.country) || valueStr(raw.estado), // fallback se usaram 'estado'
  };
  return input;
}

function valueStr(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim().length) return v.trim();
  return undefined;
}

function ensureMinimum(input: ReturnType<typeof normalizeInput>) {
  if (input.rawAddress) return; // endereço completo ok
  const count = [input.rua, input.cidade, input.pais, input.codigoPostal, input.numero].filter(Boolean).length;
  if (count < 2) {
    throw new Error("Entrada insuficiente: forneça rawAddress ou pelo menos cidade e país");
  }
}

interface MinimalResultShape {
  lat?: number;
  lng?: number;
  address: string;
  formattedAddress?: string;
  raw: { status?: string; results?: unknown[] };
}

function buildResponse(result: MinimalResultShape) {
  if (result.raw.status && result.raw.status !== "OK") {
    return Response.json(
      { error: "Geocode falhou", apiStatus: result.raw.status, address: result.address },
      { status: 424 }
    );
  }
  if (result.lat == null || result.lng == null) {
    return Response.json(
      {
        error: "Latitude/longitude não encontradas",
        address: result.address,
        apiStatus: result.raw.status,
        resultsCount: result.raw.results?.length || 0
      },
      { status: 404 }
    );
  }
  return Response.json({
    lat: result.lat,
    lng: result.lng,
    address: result.formattedAddress || result.address
  });
}

export async function POST(req: Request) {
  try {
    console.log("[POST /api/geocode]");
    const body = await req.json();
    const normalized = normalizeInput(body as AnyRecord);
    ensureMinimum(normalized);
    const result = await geocodeAddress(normalized);
    return buildResponse(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    const status = /insuficiente/i.test(msg) ? 422 : 400;
    console.error("POST /api/geocode error:", e);
    return Response.json({ error: msg }, { status });
  }
}

export async function GET(req: Request) {
  try {
    console.log("[GET /api/geocode]");
    const { searchParams } = new URL(req.url);
    const raw: AnyRecord = {};
    searchParams.forEach((v, k) => { raw[k] = v; });
    const normalized = normalizeInput(raw);
    ensureMinimum(normalized);
    const result = await geocodeAddress(normalized);
    return buildResponse(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    const status = /insuficiente/i.test(msg) ? 422 : 400;
    console.error("GET /api/geocode error:", e);
    return Response.json({ error: msg }, { status });
  }
}