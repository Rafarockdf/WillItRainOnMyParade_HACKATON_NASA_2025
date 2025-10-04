'use client';
import { useEffect, useState } from "react";

export default function Resultado() {
const [locationData, setLocationData] = useState<any>(null);
const [loading, setLoading] = useState(false);
const [explanation, setExplanation] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
const data = sessionStorage.getItem("locationData");
if (data) setLocationData(JSON.parse(data));
}, []);

async function handleExplain() {
if (!locationData) return;
setLoading(true);
setExplanation(null);
setError(null);


try {
  const res = await fetch("/api/ai/explain-weather", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(locationData),
  });

  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();

  if (!ct.includes("application/json")) {
    if (res.ok) {
      setExplanation(raw || "Resposta vazia.");
    } else {
      throw new Error(`Erro não-JSON: ${res.status} ${raw}`);
    }
    return;
  }

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Erro ao parsear JSON: ${String(e)}\nConteúdo: ${raw}`);
  }

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.details || "Erro na API");
  }

  const text = data?.explanation ?? data?.choices?.[0]?.message?.content;
  setExplanation(text || "Sem resposta da IA");
} catch (err: any) {
  setError(err?.message ?? "Erro inesperado");
} finally {
  setLoading(false);
}


}

return ( 
  <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Resultado</h2>
          <p className="text-gray-500">Colocar data do Sistema </p>
        </div>
        <span className="px-4 py-2 rounded-full font-semibold bg-[var(--background-secondary)] text-[var(--foreground)] transition-colors">
          Texto gerado por IA , baseado nos dados inseridos.
        </span>
      </div>

      <div className="grid grid-cols-5 grid-rows-2 gap-4 mb-8">

        <div className="bg-[var(--background-secondary)] rounded-xl p-6 flex flex-col items-center h-104 justify-center row-span-2">
          <span className="text-4xl font-bold mb-2">21ºc</span>
          <span className="text-gray-600 mb-2">Futuro Seletor</span>
          <span className="mt-2 px-3 py-1 bg-white rounded-full text-sm mb-2">Partly Cloudy</span>
          <div className="flex flex-col items-center mt-4"></div>
        </div>


        <div className="bg-[var(--background-secondary)] rounded-xl p-6 flex flex-col items-center h-50 justify-center">
          <span className="text-green-600 font-semibold">Min: 16ºc</span>
        </div>
        <div className="bg-[var(--background-secondary)] rounded-xl p-6 flex flex-col items-center h-50 justify-center">
          <span className="text-red-600 font-semibold">Max: 27ºc</span>
        </div>

  
        <div className="bg-[var(--background-secondary)] rounded-xl shadow p-8 w-full col-span-2 row-span-2 flex flex-col justify-center">
          <h3 className="text-xl font-bold mb-4">Possible map of the entered location</h3>
          <div className="flex items-center gap-8">
            <img src="https://www.estadosecapitaisdobrasil.com/wp-content/uploads/2015/04/mapa-mundi.png" alt="Mapa do local" className="w-full h-40 object-cover rounded-lg shadow-lg" />
          </div>
        </div>

        
        <div className="bg-[var(--background-secondary)] rounded-xl p-6 flex flex-col items-center h-50 justify-center">
          <span className="text-gray-600">Median</span>
        </div>
        <div className="bg-[var(--background-secondary)] rounded-xl p-6 flex flex-col items-center h-50 justify-center">
          <span className="text-3xl font-bold">-2mm</span>
          <span className="text-gray-600">Precipitation</span>
          <span className="mt-2 px-3 py-1 bg-white rounded-full text-sm">Low</span>
        </div>
      </div>

  <div className="bg-[var(--background-secondary)] rounded-xl shadow p-8 w-full mb-8">
    <h3 className="text-xl font-bold mb-4">Dados Climáticos</h3>
    <div className="flex items-center gap-8">
      <p>Aqui colocaremos o gráfico</p>
    </div>
  </div>

  {locationData && (
    <button
      onClick={handleExplain}
      disabled={loading}
      className="px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700 mb-4"
    >
      {loading ? "Gerando explicação..." : "Explicar com IA"}
    </button>
  )}

  {error && (
    <p className="text-red-600 whitespace-pre-wrap mb-4">{error}</p>
  )}

  {explanation && (
    <div className="border p-4 rounded bg-white shadow">
      <h2 className="font-semibold mb-2">Explicação da IA</h2>
      <div dangerouslySetInnerHTML={{ __html: explanation }}>
      </div>
    </div>
  )}
</div>

);
}
