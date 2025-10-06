export interface DistributionProbabilities { [range: string]: number; }

export interface ForecastSeriesPoint {
    time: string; 
    value: number;
}

export interface ForecastMetric<T = number> {
    predicted: T;
    interval_90: [T, T];
    probabilities?: DistributionProbabilities;
    series?: ForecastSeriesPoint[] | number[];
    unit?: string; 
}

export interface RawForecastAPIResponse {
    status?: string;
    data: {
        forecast: Record<string, ForecastMetric<number>>;
        location: { lat: number; lon: number } | { latitude: number; longitude: number };
        timestamp: string;
    };
    model_info?: { 
        model?: string;
        trained_until?: string;
        data_source?: string;
    };
}

export interface NormalizedForecast {
    lat: number;
    lon: number;
    timestamp: string;
    metrics: Record<string, ForecastMetric<number>>;
    model: string; 
    trainedUntil: string; 
    dataSource: string; 
}

export function clampIntervalNonNegative(metric: ForecastMetric<number>): ForecastMetric<number> {
    const [low, high] = metric.interval_90;
    if (low >= 0) return metric;
    return { ...metric, interval_90: [0, high] };
}

type FlexibleLocation = { lat: number; lon: number } | { latitude: number; longitude: number };

export function normalizeForecast(raw: RawForecastAPIResponse): NormalizedForecast {
    const loc: FlexibleLocation = raw.data.location as FlexibleLocation;
    const lat = 'lat' in loc ? loc.lat : loc.latitude;
    const lon = 'lon' in loc ? loc.lon : loc.longitude;

    const metrics: Record<string, ForecastMetric<number>> = {};
    for (const [key, value] of Object.entries(raw.data.forecast)) {
        let metric = value;
        // Clamp para chuva / precipitação
        if (/rain|precip/i.test(key)) {
            metric = clampIntervalNonNegative(metric);
        }
        metrics[key] = metric;
    }

    return {
        lat,
        lon,
        timestamp: raw.data.timestamp,
        metrics,
        model: raw.model_info?.model ?? "N/A",
        trainedUntil: raw.model_info?.trained_until ?? "",
        dataSource: raw.model_info?.data_source ?? "",
    };
}