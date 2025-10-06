import pandas as pd
from datetime import timedelta
from ..utils.LatLonToTimeZone import colect_timezone

def transform(df_merra,df_merra2):
    df_merra2['Timestamp'] = pd.to_datetime(df_merra2['Timestamp']) - timedelta(minutes=30)
    
    df_completed = pd.merge(df_merra, df_merra2, on="Timestamp", how="left")
    df_completed = df_completed.drop(columns=["lat_y", "lon_y"])
    df_completed = df_completed.rename(columns={"lat_x": "lat", "lon_x": "lon"})
    
    df_completed['TLML'] = df_completed['TLML'].apply(lambda x: x - 273.15)
    df_completed['SPEEDLML'] = df_completed['SPEEDLML'].apply(lambda x: x * 3.6)
    timezone = colect_timezone(df_completed['lat'][0],df_completed['lon'][0]) 
    df_completed['Timestamp_Local'] = df_completed.apply(
    lambda row: row['Timestamp'] + timezone,
    axis=1
    )
    print('Sucesso Transformação')
    print(df_completed)
    return df_completed
