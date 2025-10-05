from flask import Flask, render_template_string, request
import requests
import json

app = Flask(__name__)

# URL da sua API original (que deve estar rodando na porta 8000, segundo seu código anterior)
DATA_API_URL = "http://127.0.0.1:8000/api/collect"

# Template HTML atualizado para datetime
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
        input[type="text"], input[type="datetime-local"] { padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 16px; }
        input[type="submit"] { background-color: #0056b3; color: white; padding: 12px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold; transition: background-color 0.3s; }
        input[type="submit"]:hover { background-color: #004494; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Buscar Previsão Climática</h1>
        <form action="/get-nasa-data" method="post">
            <label for="lat">Latitude:</label>
            <input type="text" id="lat" name="lat" value="-16.34" required>
            
            <label for="lon">Longitude:</label>
            <input type="text" id="lon" name="lon" value="-46.88" required>
            
            <label for="datetime">Data e Hora (UTC):</label>
            <input type="datetime-local" id="datetime" name="datetime" value="2024-01-03T15:00" required>
            
            <input type="submit" value="Buscar Dados">
        </form>
    </div>
</body>
</html>
"""

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
    return render_template_string(HTML_FORM)

@app.route('/get-nasa-data', methods=['POST'])
def get_nasa_data():
    try:
        # Coleta os dados do formulário
        lat = float(request.form['lat'])
        lon = float(request.form['lon'])
        datetime_value = request.form['datetime']

        # Monta o JSON para a API principal
        payload = {
            "lat": lat,
            "lon": lon,
            "datetime": f"{datetime_value}:00"  # garante segundos
        }

        # Envia a requisição POST
        response = requests.post(DATA_API_URL, json=payload)
        response.raise_for_status()

        # Formata resposta
        response_data = response.json()
        formatted_json = json.dumps(response_data, indent=4, ensure_ascii=False)

        return render_template_string(HTML_RESULTS, data=formatted_json)

    except requests.exceptions.RequestException as e:
        return f"<h1>Erro ao contatar a API de dados</h1><p>{e}</p><a href='/'>Voltar</a>", 500
    except Exception as e:
        return f"<h1>Erro inesperado</h1><p>{e}</p><a href='/'>Voltar</a>", 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
