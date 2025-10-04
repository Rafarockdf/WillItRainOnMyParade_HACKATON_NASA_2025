
import pandas as pd
from prophet import Prophet


def modelo(df_completed,datetime):
    
    df_prophet = df_completed.rename(columns={'Timestamp_Local': 'ds', 'TLML': 'y'})
    # Selecionando apenas as colunas que você quer usar como regressors
    df_prophet = df_prophet[['ds', 'y', 'QLML', 'SPEEDLML', 'PRECTOTCORR','TQV']]
    model = Prophet(
        interval_width=0.95,      
        seasonality_mode='multiplicative',
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True
    )
    model.add_seasonality(name='mensal', period=30.5, fourier_order=5)
    model.add_seasonality(name='diaria', period=24, fourier_order=10)
    print("Iniciando o treinamento do modelo...")
    model.fit(df_prophet)
    print("Treinamento concluído!")
    future = model.make_future_dataframe(periods=2920, freq='H')
    forecast = model.predict(future)