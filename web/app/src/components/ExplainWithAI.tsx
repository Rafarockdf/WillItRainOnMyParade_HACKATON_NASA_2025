"use client";
import { useState } from "react";

export default function WeatherExplainer() {
  const [resp, setResp] = useState<string>("");

  const handleClick = async () => {
    setResp("⏳ Gerando explicação...");

    try {
        const info = sessionStorage.getItem("locationData");
        console.log("Location data from sessionStorage:", info);
        
        if (!info) {
            setResp("⚠️ Dados de localização não encontrados.");
            return;
        }
      const res = await fetch("/api/ai/explain-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.parse(info),
      });

      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();
      console.log("[/api/ai/explain-weather] status=", res.status, "ct=", ct, "raw=", raw);

      if (!ct.includes("application/json")) {
        setResp(res.ok ? raw : `Erro não-JSON: ${res.status} ${raw}`);
        return;
      }

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        setResp(`Erro ao parsear JSON: ${String(e)}\nConteúdo: ${raw}`);
        return;
      }

      setResp(
        res.ok
          ? data?.explanation ?? "⚠️ Sem resposta da IA"
          : `Erro backend: ${data?.error ?? "desconhecido"}`
      );
    } catch (err) {
      console.error(err);
      setResp("Erro de rede ou servidor");
    }
  };

  return (
    <div>
      <button onClick={handleClick} className="px-4 py-2 bg-blue-500 text-white rounded">
        Explicar Clima
      </button>
      <p className="mt-4 whitespace-pre-wrap">{resp}</p>
    </div>
  );
}