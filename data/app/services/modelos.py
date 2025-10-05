import pandas as pd
from prophet import Prophet
import json as js

def modelo(df_completed,date):
    
    print('entrei')
    print(df_completed.head(1))
    print(df_completed.info())
    df_prophet_temp = df_completed.rename(columns={'Timestamp_Local': 'ds', 'TLML': 'y'})
    print(df_prophet_temp)
    print('Passo1')
    df_prophet_temp = df_prophet_temp[['ds', 'y']]
    print('Passo2')
    df_prophet_humidity  = df_completed.rename(columns={'Timestamp_Local': 'ds', 'QLML': 'y'})
    print('Passo3')
    df_prophet_humidity = df_prophet_humidity[['ds', 'y']]
    print('Passo4')
    df_prophet_wind = df_completed.rename(columns={'Timestamp_Local': 'ds', 'SPEEDLML': 'y'})
    print('Passo5')
    df_prophet_wind = df_prophet_wind[['ds', 'y']]
    print('Passo6')
    df_prophet_precipitation = df_completed.rename(columns={'Timestamp_Local': 'ds', 'PRECTOTCORR': 'y'})
    print('Passo7')
    df_prophet_precipitation = df_prophet_precipitation[['ds', 'y']]
    print('Passo8')

    df_prophet_water = df_completed.rename(columns={'Timestamp_Local': 'ds', 'TQV': 'y'})
    print('Passo9')
    df_prophet_water = df_prophet_water[['ds', 'y']]
    print('Sucesso1')
    
    model_temp = Prophet(
        interval_width=0.95,      
        seasonality_mode='multiplicative',
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True
    )
    model_humidity = Prophet(
        interval_width=0.95,      
        seasonality_mode='multiplicative',
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True
    )
    model_wind = Prophet(
        interval_width=0.95,      
        seasonality_mode='multiplicative',
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True
    )
    model_preciptation = Prophet(
        interval_width=0.95,      
        seasonality_mode='multiplicative',
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True
    )
    model_water = Prophet(
        interval_width=0.95,      
        seasonality_mode='multiplicative',
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True
    )
    print('Sucesso2')
    model_temp.add_seasonality(name='mensal', period=30.5, fourier_order=5)
    model_temp.add_seasonality(name='diaria', period=24, fourier_order=10)

    model_humidity.add_seasonality(name='mensal', period=30.5, fourier_order=5)
    model_humidity.add_seasonality(name='diaria', period=24, fourier_order=10)

    model_wind.add_seasonality(name='mensal', period=30.5, fourier_order=5)
    model_wind.add_seasonality(name='diaria', period=24, fourier_order=10)

    model_preciptation.add_seasonality(name='mensal', period=30.5, fourier_order=5)
    model_preciptation.add_seasonality(name='diaria', period=24, fourier_order=10)

    model_water.add_seasonality(name='mensal', period=30.5, fourier_order=5)
    model_water.add_seasonality(name='diaria', period=24, fourier_order=10)
    print('Sucesso3')
    print("Iniciando o treinamento do modelo...")
    model_temp.fit(df_prophet_temp)
    model_humidity.fit(df_prophet_humidity)
    model_wind.fit(df_prophet_wind)
    model_preciptation.fit(df_prophet_precipitation)
    model_water.fit(df_prophet_water)
    print("Treinamento concluído!")
    print("\n")
    print("Realizando as previsões...")
    future = model_temp.make_future_dataframe(periods=2920, freq='H')

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
            timestamps = forecast_temp.loc[day_mask, 'ds']
            values = forecast_temp.loc[day_mask, 'yhat'].values.tolist()

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

    return json_output
