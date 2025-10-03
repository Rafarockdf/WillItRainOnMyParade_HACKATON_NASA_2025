'use client';
import { useEffect, useState } from "react";

export default function Resultado() {
  const [locationData, setLocationData] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem("locationData");
    if (data) {
      setLocationData(JSON.parse(data));
    }
  }, []);

  return (
    <div>
      <h1>Dados de Localização</h1>
      {locationData ? (
        <pre>{JSON.stringify(locationData, null, 2)}</pre>
      ) : (
        <p>Nenhum dado de localização disponível.</p>
      )}
    </div>
  );
}