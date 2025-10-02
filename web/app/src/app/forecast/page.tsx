export default function Resultado() {
  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Resultado</h2>
          <p className="text-gray-500">Colocar data do Sistema </p>
        </div>
        <span className="bg-teal-100 text-teal-700 px-4 py-2 rounded-full font-semibold">
          Texto gerado por IA , baseado nos dados inseridos.
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-8">
        <div className="bg-[var(--background-secondary)] rounded-xl p-6 flex flex-col items-center h-100 justify-center row-span-2">
          <span className="text-4xl font-bold mb-2">21ºc</span>
          <span className="text-gray-600 mb-2">Weather</span>
          <span className="mt-2 px-3 py-1 bg-white rounded-full text-sm mb-2">Partly Cloudy</span>
          <div className="flex flex-col items-center mt-4">
            <span className="text-green-600 font-semibold">Min: 16ºc</span>
            <span className="text-red-600 font-semibold">Max: 27ºc</span>
          </div>
        </div>
        <div className="bg-[var(--background-secondary)] rounded-xl p-6 flex flex-col items-center h-40 justify-center">
        </div>
        <div className="bg-[var(--background-secondary)] rounded-xl p-6 flex flex-col items-center h-40 justify-center">
          <span className="text-3xl font-bold">-2mm</span>
          <span className="text-gray-600">Precipitation</span>
          <span className="mt-2 px-3 py-1 bg-white rounded-full text-sm">Low</span>
        </div>
        <div className="bg-[var(--background-secondary)] rounded-xl p-6 flex flex-col items-center h-40 justify-center">
          <span className="text-3xl font-bold">10km</span>
          <span className="text-gray-600">Wind Speed</span>
          <span className="mt-2 px-3 py-1 bg-white rounded-full text-sm">Windy</span>
        </div>

        <div className="bg-[var(--background-secondary)] rounded-xl shadow p-8 w-full col-span-3">
            <h3 className="text-xl font-bold mb-4">Dados Do Climáticos (Grafico de linhas passado em breve)</h3>
        <div className="flex items-center gap-8">

        </div>
      </div>
      </div>

     
    </div>
  );
}