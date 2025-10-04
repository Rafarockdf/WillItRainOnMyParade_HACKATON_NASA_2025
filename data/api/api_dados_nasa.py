from flask import Flask, render_template_string, request, jsonify
import requests
import json

# Cria a nova aplicação Flask que atuará como cliente
app = Flask(__name__)

# URL da sua API de dados original (que deve estar rodando na porta 5000)
DATA_API_URL = "http://127.0.0.1:5000/api/collect"

# Template HTML para o formulário de entrada
HTML_FORM = """
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cliente da API de Dados da NASA</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f7f6; color: #333; line-height: 1.6; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        h1 { color: #0b3d91; text-align: center; }
        form { display: flex; flex-direction: column; gap: 15px; }
        label { font-weight: bold; }
        input[type="text"], input[type="date"] { padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 16px; }
        input[type="submit"] { background-color: #0056b3; color: white; padding: 12px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold; transition: background-color 0.3s; }
        input[type="submit"]:hover { background-color: #004494; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Buscar Dados Climáticos da NASA</h1>
        <form action="/get-nasa-data" method="post">
            <label for="lat">Latitude:</label>
            <input type="text" id="lat" name="lat" value="-16.34" required>
            
            <label for="lon">Longitude:</label>
            <input type="text" id="lon" name="lon" value="-46.88" required>
            
            <label for="start_date">Data de Início:</label>
            <input type="date" id="start_date" name="start_date" value="2024-01-01" required>
            
            <label for="end_date">Data de Fim:</label>
            <input type="date" id="end_date" name="end_date" value="2024-01-05" required>
            
            <input type="submit" value="Buscar Dados">
        </form>
    </div>
</body>
</html>
"""

# Template HTML para exibir os resultados
HTML_RESULTS = """
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Resultados da API</title>
    <style>
        body { font-family: monospace; background-color: #282c34; color: #abb2bf; padding: 20px; }
        .container { background: #21252b; padding: 20px; border-radius: 8px; }
        h1 { color: #61afef; }
        a { color: #98c379; text-decoration: none; display: inline-block; margin-top: 20px; }
        pre { white-space: pre-wrap; word-wrap: break-word; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Resposta da API</h1>
        <pre>{{ data }}</pre>
        <a href="/">Voltar ao formulário</a>
    </div>
</body>
</html>

"""

@app.route('/')
def index():
    """ Rota principal que exibe o formulário HTML. """
    return render_template_string(HTML_FORM)

@app.route('/get-nasa-data', methods=['POST'])
def get_nasa_data():
    """ Rota que recebe os dados do formulário, chama a outra API e exibe o resultado. """
    try:
        # 1. Pega os dados do formulário enviado pelo usuário
        lat = request.form['lat']
        lon = request.form['lon']
        start_date = request.form['start_date']
        end_date = request.form['end_date']

        # 2. Monta o corpo (payload) da requisição no formato JSON que a outra API espera
        payload = {
            "lat": float(lat),
            "lon": float(lon),
            "time_start": f"{start_date}T00:00:00",
            "time_end": f"{end_date}T00:00:00"
        }

        # 3. Faz a requisição POST para a sua API de dados
        response = requests.post(DATA_API_URL, json=payload)
        response.raise_for_status()  # Lança um erro se a resposta não for 2xx

        # 4. Pega o JSON da resposta e o formata para exibição
        response_data = response.json()
        formatted_json = json.dumps(response_data, indent=4, ensure_ascii=False)
        
        # 5. Renderiza a página de resultados com os dados formatados
        return render_template_string(HTML_RESULTS, data=formatted_json)

    except requests.exceptions.RequestException as e:
        # Trata erros de conexão ou da API de dados
        return f"<h1>Erro ao contatar a API de dados</h1><p>{e}</p><a href='/'>Voltar</a>", 500
    except Exception as e:
        # Trata outros erros inesperados
        return f"<h1>Ocorreu um erro inesperado</h1><p>{e}</p><a href='/'>Voltar</a>", 500

if __name__ == '__main__':
    # Roda esta aplicação em uma porta diferente (5001) para não conflitar com a sua API original (5000)
    app.run(port=5001, debug=True)
