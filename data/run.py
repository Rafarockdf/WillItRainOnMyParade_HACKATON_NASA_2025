from app.__init__ import create_app
from waitress import serve
app = create_app()



if __name__ == '__main__':
    print("Servidor de produção Waitress iniciado em http://127.0.0.1:8000")
    serve(
        app,
        host='127.0.0.1',
        port=8000,
        threads=8,  # Número de threads para processar requisições simultaneamente
        
        # --- AQUI ESTÁ A CONFIGURAÇÃO DO TIMEOUT ---
        # Aumenta o timeout de inatividade do canal para 20 minutos (1200 segundos).
        # O padrão é 300 (5 minutos).
        channel_timeout=12000
    )