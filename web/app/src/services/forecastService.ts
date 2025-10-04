import { ForecastPayload, normalizedForecast, NormalizedForecast } from "../../types/forecast";

const MOCK: ForecastPayload = {
    location: { latitude: -23.55, longitude: -46.63 },
    timestamp: "2025-12-15T15:00:00Z",
    forecast: {
    temperature: {
      predicted: 28.4,
      interval_90: [25.8, 30.9],
      probabilities: { "<20": 0.05, "20-25": 0.20, "25-30": 0.50, ">30": 0.25 },
      unit: "°C"
    },
    humidity: {
      predicted: 65,
      interval_90: [58, 72],
      probabilities: { "<50": 0.10, "50-70": 0.60, ">70": 0.30 },
      unit: "%"
    },
    wind_speed: {
      predicted: 12.3,
      interval_90: [8.1, 16.7],
      probabilities: { "<5": 0.10, "5-15": 0.70, ">15": 0.20 },
      unit: "km/h"
    },
    rain: {
      predicted: 2.4,
      interval_90: [0.0, 8.5],
      probabilities: {
        "no_rain": 0.55,
        "light_rain(0-5mm)": 0.30,
        "moderate_rain(5-20mm)": 0.12,
        "heavy_rain(>20mm)": 0.03
      },
      unit: "mm"
    }
  },
  model_info: {
    model: "RandomForest_QuantileRegression",
    trained_until: "2025-09-01",
    data_source: "NASA MERRA-2 + Estação Local"
  }
}

export async function fetchForecast(lat: number, lng: number, isoDatetime: string): Promise<NormalizedForecast> {
    const base = process.env.FORECAST_API_BASE_URL;
    if (!base) {
        return normalizedForecast(MOCK);
    }

    try {
        const url = new URL("/forecast", base);
        url.searchParams.set("lat", String(lat));
        url.searchParams.set("lng", String(lng));
        url.searchParams.set("datetime", isoDatetime);

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error(`Falha ao buscar previsão (${res.status})`);
        const data: ForecastPayload = await res.json();
        return normalizedForecast(data);
    } catch {
        return normalizedForecast(MOCK);
    }
}