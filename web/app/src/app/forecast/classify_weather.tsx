export default function ClassifyWeather() {
	// Limites
	const LIMITE_MUITO_QUENTE = 32; // °C
	const LIMITE_MUITO_FRIO = 13;   // °C
	const LIMITE_VENTO_FORTE = 40;  // km/h
	const LIMITE_CHUVA_FORTE = 5;   // mm/h
	const LIMITE_DESCONFORTO_TEMP = 29; // °C
	const LIMITE_DESCONFORTO_UMIDADE = 70; // %

	const apiDataRaw = sessionStorage.getItem('forecastData');
	const apiData = apiDataRaw ? JSON.parse(apiDataRaw) : null;

	function convertPrecipitationRate(valueKgM2S1: number): number {
		return valueKgM2S1 * 3600;
	}

	const temperatura = apiData?.metrics?.temperature?.predicted ?? 0;
	const umidade = apiData?.metrics?.humidity?.predicted ?? 0;
	const vento = apiData?.metrics?.wind_speed?.predicted ?? 0;
	const chuva = convertPrecipitationRate(apiData?.metrics?.precipitation?.predicted ?? 0);

	const pressaoHpa = 1013.25;
	const es = 6.112 * Math.exp((17.67 * temperatura) / (temperatura + 243.5));
	const e = (umidade * pressaoHpa) / (0.622 + 0.378 * umidade);

	let relativeHumidity = (e / es) * 100;
	relativeHumidity = Math.min(relativeHumidity, 100.0);

	let classificacao = "Normal";

	if (temperatura >= LIMITE_MUITO_QUENTE && umidade > LIMITE_DESCONFORTO_UMIDADE) {
		classificacao = "very uncomfortable";
	} else if (chuva > LIMITE_CHUVA_FORTE) {
		classificacao = "very wet";
	} else if (temperatura >= LIMITE_MUITO_QUENTE) {
		classificacao = "very hot";
	} else if (temperatura < LIMITE_MUITO_FRIO) {
		classificacao = "very cold";
	} else if (vento > LIMITE_VENTO_FORTE) {
		classificacao = "very windy";
	}

	return <h1 className="text-3xl font-bold tracking-tight">{classificacao}</h1>;
}
