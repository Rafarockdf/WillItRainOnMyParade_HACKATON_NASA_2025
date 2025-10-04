export function buildPromptFromForecast(data: any) {
  const lat = data?.location?.lat;
  const lng = data?.location?.lng;
  const loc = data?.location?.address

  console.log("Building prompt from forecast data:", { lat, lng, loc, data });

  return `Explique de forma didática o clima previsto para ${data.lat}, ${data.lng}, ${data.address}.

Dados:
- Temperatura: 30.0 °C
- Umidade: 20%
- Vento: 15 km/h
- Chuva: 20 mm

Regras:
1. Resuma em 2-3 frases o clima esperado.
2. Diga os riscos principais (chuva, calor, vento).
3. Dê 3 recomendações práticas.
4. Formate o texto com html simples (negrito, listas).
5. Responda em inglês.
6. Dentro da explicação cite a latitude e longitude do local e também o endereço.
`;
}