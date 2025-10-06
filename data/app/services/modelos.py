from app.services.store_forecast import buscar_previsao_no_banco, salvar_previsao_no_banco, salvar_modelo_no_banco, buscar_modelo_no_banco, salvar_dados_historicos
import pandas as pd
from prophet import Prophet
import json as js

def existe_dados_historicos(lat, lon):
    from app.services.store_forecast import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT 1 FROM historico_localizacao WHERE lat=%s AND lon=%s LIMIT 1
        """,
        (lat, lon)
    )
    existe = cursor.fetchone() is not None
    cursor.close()
    conn.close()
    return existe

def modelo(df_completed,date):
    def get_or_train_model(tipo, df):
        modelo = modelos_treinados.get(tipo)
        if modelo:
            modelo.fit(df)
        else:
            modelo = Prophet(
                interval_width=0.95,
                seasonality_mode='multiplicative',
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=True
            )
            modelo.add_seasonality(name='mensal', period=30.5, fourier_order=5)
            modelo.add_seasonality(name='diaria', period=24, fourier_order=10)
            modelo.fit(df)
        return modelo
    print('Entrei no modelo')
    lat = df_completed['lat'].iloc[0]
    lon = df_completed['lon'].iloc[0]
    df_local = df_completed[(df_completed['lat'] == lat) & (df_completed['lon'] == lon)].copy()

    # NOVA LÓGICA: verifica se já existem dados históricos para lat/lon
    if existe_dados_historicos(lat, lon):
        print('Dados históricos já existem para esta localização. Apenas faz previsões.')
        modelos_treinados = {}
        for tipo in ["temperature", "humidity", "wind_speed", "rain", "water_vapor"]:
            modelo_carregado = buscar_modelo_no_banco(lat, lon, tipo)
            if modelo_carregado:
                print(f"Reaproveitando modelo Prophet treinado para {tipo}...")
                modelos_treinados[tipo] = modelo_carregado
            else:
                modelos_treinados[tipo] = None
        df_prophet_temp = df_local.rename(columns={'Timestamp_Local': 'ds', 'TLML': 'y'})[['ds', 'y', 'lat', 'lon']]
        df_prophet_humidity = df_local.rename(columns={'Timestamp_Local': 'ds', 'QLML': 'y'})[['ds', 'y', 'lat', 'lon']]
        df_prophet_wind = df_local.rename(columns={'Timestamp_Local': 'ds', 'SPEEDLML': 'y'})[['ds', 'y', 'lat', 'lon']]
        df_prophet_precipitation = df_local.rename(columns={'Timestamp_Local': 'ds', 'PRECTOTCORR': 'y'})[['ds', 'y', 'lat', 'lon']]
        df_prophet_water = df_local.rename(columns={'Timestamp_Local': 'ds', 'TQV': 'y'})[['ds', 'y', 'lat', 'lon']]
        model_temp = modelos_treinados["temperature"] or get_or_train_model("temperature", df_prophet_temp)
        model_humidity = modelos_treinados["humidity"] or get_or_train_model("humidity", df_prophet_humidity)
        model_wind = modelos_treinados["wind_speed"] or get_or_train_model("wind_speed", df_prophet_wind)
        model_preciptation = modelos_treinados["rain"] or get_or_train_model("rain", df_prophet_precipitation)
        model_water = modelos_treinados["water_vapor"] or get_or_train_model("water_vapor", df_prophet_water)
    else:
        print('Dados históricos não existem para esta localização. Salvando e treinando modelos...')
        salvar_dados_historicos(lat, lon, df_local)
        modelos_treinados = {}
        for tipo in ["temperature", "humidity", "wind_speed", "rain", "water_vapor"]:
            modelos_treinados[tipo] = None
        df_prophet_temp = df_local.rename(columns={'Timestamp_Local': 'ds', 'TLML': 'y'})[['ds', 'y', 'lat', 'lon']]
        df_prophet_humidity = df_local.rename(columns={'Timestamp_Local': 'ds', 'QLML': 'y'})[['ds', 'y', 'lat', 'lon']]
        df_prophet_wind = df_local.rename(columns={'Timestamp_Local': 'ds', 'SPEEDLML': 'y'})[['ds', 'y', 'lat', 'lon']]
        df_prophet_precipitation = df_local.rename(columns={'Timestamp_Local': 'ds', 'PRECTOTCORR': 'y'})[['ds', 'y', 'lat', 'lon']]
        df_prophet_water = df_local.rename(columns={'Timestamp_Local': 'ds', 'TQV': 'y'})[['ds', 'y', 'lat', 'lon']]
        model_temp = get_or_train_model("temperature", df_prophet_temp)
        model_humidity = get_or_train_model("humidity", df_prophet_humidity)
        model_wind = get_or_train_model("wind_speed", df_prophet_wind)
        model_preciptation = get_or_train_model("rain", df_prophet_precipitation)
        model_water = get_or_train_model("water_vapor", df_prophet_water)
        salvar_modelo_no_banco(lat, lon, "temperature", model_temp)
        salvar_modelo_no_banco(lat, lon, "humidity", model_humidity)
        salvar_modelo_no_banco(lat, lon, "wind_speed", model_wind)
        salvar_modelo_no_banco(lat, lon, "rain", model_preciptation)
        salvar_modelo_no_banco(lat, lon, "water_vapor", model_water)
    print('Sucesso2')
    print("Realizando as previsões...")
    future = model_temp.make_future_dataframe(periods=2920, freq='H')
    future['lat'] = lat
    future['lon'] = lon
    forecast_temp = model_temp.predict(future)
    forecast_humidity = model_humidity.predict(future)
    forecast_wind = model_wind.predict(future)
    forecast_preciptation = model_preciptation.predict(future)
    forecast_water = model_water.predict(future)
    print("Previsões geradas!")
    print("\n")
    # --- Temperatura ---


    def build_forecast_json(date, forecasts_dict, df_completed):
        """
        Gera JSON de previsões para uma data/hora específica,
        incluindo a série do dia inteiro para cada variável.
        
        Parameters:
            date: str ou datetime - data/hora de interesse
            forecasts_dict: dict - {"variavel": forecast_dataframe_Prophet, ...}
            df_completed: pd.DataFrame - DataFrame com colunas ['lat','lon']
        
        Returns:
            dict - JSON estruturado
        """
        
        date_obj = pd.to_datetime(date)
        output = {
            'location': {
                'lat': df_completed['lat'].iloc[0],
                'lon': df_completed['lon'].iloc[0]
            },
            'timestamp': str(date_obj),
            'forecast': {}
        }
        
        for var_name, df_forecast in forecasts_dict.items():
            df_forecast['ds'] = pd.to_datetime(df_forecast['ds'])
            
            predicted = df_forecast.loc[df_forecast['ds'] == date_obj, 'yhat'].values[0]
            interval_90 = df_forecast.loc[df_forecast['ds'] == date_obj, ['yhat_lower','yhat_upper']].values[0].tolist()
            
            day_mask = forecast_temp['ds'].dt.date == date_obj.date()

            # Seleciona os timestamps e valores
            timestamps = df_forecast.loc[day_mask, 'ds']
            values = df_forecast.loc[day_mask, 'yhat'].values.tolist()

            # Formata os timestamps para string
            timestamps_formatted = [ts.strftime("%Y-%m-%d %H:%M:%S") for ts in timestamps]

            # Cria o dicionário final
            series_df = {
                "timestamp": timestamps_formatted,
                "values": values
            }
            output['forecast'][var_name] = {
                'predicted': predicted,
                'interval_90': interval_90,
                'series': series_df
            }
        
        return output

    forecasts_dict = {
        "temperature": forecast_temp,
        "humidity": forecast_humidity,
        "wind_speed": forecast_wind,
        "rain": forecast_preciptation,
        "water_vapor": forecast_water
    }

    json_output = build_forecast_json(date, forecasts_dict, df_completed)
    # Salva a previsão no banco para reutilização futura
    salvar_previsao_no_banco(lat, lon, date, json_output)
    return json_output

def get_or_train_global_model(tipo, df):
    modelo = buscar_modelo_no_banco(None, None, tipo)
    if modelo:
        print(f"Reaproveitando modelo global Prophet para {tipo}...")
        return modelo
    else:
        modelo = Prophet(
            interval_width=0.95,
            seasonality_mode='multiplicative',
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=True
        )
        modelo.add_seasonality(name='mensal', period=30.5, fourier_order=5)
        modelo.add_seasonality(name='diaria', period=24, fourier_order=10)
        modelo.add_regressor('lat')
        modelo.add_regressor('lon')
        modelo.fit(df)
        salvar_modelo_no_banco(None, None, tipo, modelo)
        return modelo
