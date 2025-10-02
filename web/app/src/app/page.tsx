export default function Home() {
  return (
    <div className="p-2 justify-center items-center flex flex-col">
      <h1 className="text-3xl font-bold mb-4">Bem-vindo ao Previsão Certa!</h1>
      <p className="text-lg mb-6 text-center max-w-xl">
        Sua ferramenta definitiva para previsões meteorológicas precisas. Descubra se vai chover no seu desfile com dados confiáveis e atualizados.
      </p>
      <a
        href="/forecast"
        className="bg-[var(--foreground)] text-[var(--background)] px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
      >
        Ver Previsão do Tempo
      </a>
    </div>
  );
}
