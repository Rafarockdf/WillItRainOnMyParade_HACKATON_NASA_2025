from flask import Blueprint, jsonify, request
import pandas as pd
from app.services.collect_api_giovanni import colect_variables
from app.services.transform import transform
from app.services.modelos import modelo
# A função de load não é mais necessária se o objetivo é apenas retornar o JSON
# from app.services.load import load_data_to_db 

api_bp = Blueprint('api', __name__)

@api_bp.route('/collect', methods=['POST'])
def collect_and_load_data():
    """
    Endpoint to trigger data collection, transformation, and return the resulting DataFrame as JSON.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request: Missing JSON body"}), 400

    try:
        lat = data['lat']
        lon = data['lon']
        date = data['datetime']
        time_start = "2020-01-01T00:00:00"
        time_end = "2025-09-28T00:00:00"
        lista_merra = ['M2I1NXLFO_5_12_4_QLML', 'M2I1NXLFO_5_12_4_TLML', 'M2I1NXLFO_5_12_4_SPEEDLML']
        lista_merra2 = ['M2T1NXFLX_5_12_4_PRECTOTCORR', 'M2T1NXSLV_5_12_4_TQV']
    except KeyError as e:
        return jsonify({"error": f"Missing required parameter: {e}"}), 400

    try:
        # 1. Collect Data
        print('Iniciando coleta de dados...')
        df_merra = colect_variables(lista_merra, lat, lon, time_start, time_end)
        df_merra2 = colect_variables(lista_merra2, lat, lon, time_start, time_end)
        
        # 2. Transform Data
        df_final = transform(df_merra, df_merra2)
        
        # 3. Converte o DataFrame para uma lista de dicionários
        # O formato 'records' cria uma lista, onde cada item é um dicionário representando uma linha.
        result_data = df_final.to_dict(orient='records')
        print('Sucesso sem mod')
        forecast = modelo(df_final,date)
        print('Sucesso com mod')
        print(forecast)
        # 4. Return success response com os dados do DataFrame
        return jsonify({
            "message": "Data processed successfully!",
            "parameters_received": {
                "lat": lat,
                "lon": lon,
                "time_start": date,
            },
            "data": forecast  # <-- Adiciona os dados do DataFrame na resposta JSON
        }), 200
        
    except Exception as e:
        return jsonify({"error": "An internal error occurred during data processing.", "details": str(e)}), 500