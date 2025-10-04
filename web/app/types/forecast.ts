export interface DistributionProbabilities { [range: string]: number; }

export interface ForecastMetric<T = number> {
    predicted: T;
    interval_90: [T, T];
    probabilities: DistributionProbabilities;
    unit: string;
}

export interface ForecastPayload {
    location: { 
        latitude: number, 
        longitude: number,
    };
    timestamp: string;
    forecast: {
        temperature: ForecastMetric<number>;
        humidity: ForecastMetric<number>;
        wind_speed: ForecastMetric<number>;
        rain: ForecastMetric<number>;
    };
    model_info: {
        model: string;
        trained_until: string;
        data_source: string;
    };
}

export interface NormalizedForecast {
    lat: number;
    lng: number;
    datetime: string;
    temperature: ForecastMetric<number>;
    humidity: ForecastMetric<number>;
    wind: ForecastMetric<number>;
    rain: ForecastMetric<number>;
    model: string;
    trainedUntil: string;
    dataSource: string;
}

export function normalizedForecast(data: ForecastPayload): NormalizedForecast {
    return {
        lat: data.location.latitude,
        lng: data.location.longitude,
        datetime: data.timestamp,
        temperature: data.forecast.temperature,
        humidity: data.forecast.humidity,
        wind: data.forecast.wind_speed,
        rain: data.forecast.rain,
        model: data.model_info.model,
        trainedUntil: data.model_info.trained_until,
        dataSource: data.model_info.data_source,
    }
}