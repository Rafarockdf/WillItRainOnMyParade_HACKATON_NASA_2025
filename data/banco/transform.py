import pandas as pd
from datetime import timedelta
from LatLonToTimeZone import colect_timezone


def transform(df_merra,df_merra2,timezone):
    df_merra2['Timestamp'] = pd.to_datetime(df_merra2['Timestamp']) - timedelta(minutes=30)
    
    df_completed = pd.merge(df_merra, df_merra2, on="Timestamp", how="left")
    
    df_completed['TLML'] = df_completed['TLML'].apply(lambda x: x - 273.15)
    
    timezone_list = [colect_timezone(lat, lon) for lat, lon in zip(df_completed['lat'], df_completed['lon'])]
    
    df_completed['timezone'] = timezone_list
    
    df_completed['Timestamp_Local'] = df_completed.apply(
        lambda row: row['Timestamp_UTC'] + colect_timezone(row['lat'], row['lon']),
        axis=1
    )
