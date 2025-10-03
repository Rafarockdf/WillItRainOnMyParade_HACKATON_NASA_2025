import pandas 
import netrc
import requests
from requests.auth import HTTPBasicAuth
import os
import io
import pandas
import numpy as np
import matplotlib.pyplot as plt

from config_env import TOKEN
from collect_last_date_last_update_giovanni import collect_last_update
from datetime import timedelta

signin_url = "https://api.giovanni.earthdata.nasa.gov/signin"
time_series_url = "https://api.giovanni.earthdata.nasa.gov/timeseries"

def call_time_series(lat,lon,time_start,time_end,data):
    """
    INPUTS:
    lat - latitude
    lon - longitude
    time_start - start of time series in YYYY-MM-DDThh:mm:ss format (UTC)
    end_time - end of the time series in YYYY-MM-DDThh:mm:ss format (UTC)
    data - name of the data parameter for the time series
    
    OUTPUT:
    time series csv output string
    """
    query_parameters = {
        "data":data,
        "location":"[{},{}]".format(lat,lon),
        "time":"{}/{}".format(time_start,time_end)
    }
    headers = {"Authorization":f"Bearer {TOKEN}"}
    response=requests.get(time_series_url,params=query_parameters,headers=headers)
    return response.text

def parse_csv(ts):
    """
    INPUTS:
    ts - time series output of the time series service
    
    OUTPUTS:
    headers,df - the headers from the CSV as a dict and the values in a pandas dataframe 
    """
    with io.StringIO(ts) as f:
        # the first 13 rows are header
        headers = {}
        for i in range(13):
            line = f.readline()
            key,value = line.split(",",maxsplit=1)
            headers[key] = value.strip()

        # Read the csv proper
        df = pandas.read_csv(
            f,
            header=1,
            names=("Timestamp",headers["param_short_name"]),
            converters={"Timestamp":pandas.Timestamp}
        )

    return headers, df

import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm  # barra de progresso

def colect_variables(list_variables, lat, lon, time_start, time_end):
    df_completed = pd.DataFrame()
    
    # Função interna para processar cada variável
    def process_variable(data):
        ts = call_time_series(lat, lon, time_start, time_end, data)
        headers, df_new = parse_csv(ts)
        return data, df_new

    # Executa em paralelo
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_var = {executor.submit(process_variable, data): data for data in list_variables}
        
        # Barra de progresso
        for future in tqdm(as_completed(future_to_var), total=len(future_to_var), desc="Processando variáveis"):
            data = future_to_var[future]
            try:
                _, df_new = future.result()
                print(f"Columns for variable '{data}': {df_new.columns.to_list()}")

                if 'Timestamp' not in df_new.columns:
                    print(f"Warning: 'Timestamp' column not found for '{data}'. Skipping.")
                    continue

                print(f"Total rows df_new ({data}): {len(df_new.index)}")

                if df_completed.empty:
                    df_completed = df_new
                else:
                    df_completed = pd.merge(df_completed, df_new, on="Timestamp", how="inner")

            except Exception as e:
                print(f"Erro ao processar '{data}': {e}")

    df_completed['lat'] = lat
    df_completed['lon'] = lon
    return df_completed

def collect(list_merra, list_merra2, list_of_locations, time_start, time_end):
    """
    Coleta dados para múltiplas localizações em paralelo.

    INPUTS:
    list_merra (list): Lista de nomes de variáveis do primeiro grupo.
    list_merra2 (list): Lista de nomes de variáveis do segundo grupo.
    list_of_locations (list of tuples): Lista com tuplas de coordenadas, ex: [(lat1, lon1), (lat2, lon2), ...].
    time_start (str): Data de início.
    time_end (str): Data de fim.
    
    OUTPUTS:
    tuple: Contendo dois DataFrames (final_df_merra, final_df_merra2) com os dados de todas as localizações consolidados.
    """
    all_merra_dfs = []
    all_merra2_dfs = []

    # 1. Define a tarefa que cada thread irá executar.
    #    Esta função processará UMA localização por vez.
    def process_location(location):
        lat, lon = location
        # Reutiliza a sua função que já coleta variáveis em paralelo para um único ponto
        df_m1 = colect_variables(list_merra, lat, lon, time_start, time_end)
        df_m2 = colect_variables(list_merra2, lat, lon, time_start, time_end)
        return df_m1, df_m2

    # 2. Executa a tarefa 'process_location' em paralelo para CADA localização.
    with ThreadPoolExecutor(max_workers=5) as executor:
        # Mapeia cada futura execução à sua localização correspondente
        future_to_location = {executor.submit(process_location, loc): loc for loc in list_of_locations}
        
        # Usa tqdm para criar uma barra de progresso para as localizações
        for future in tqdm(as_completed(future_to_location), total=len(list_of_locations), desc="Processando Localizações"):
            location = future_to_location[future]
            try:
                # 3. Coleta o resultado quando uma thread termina
                df_merra_result, df_merra2_result = future.result()
                
                # Adiciona os dataframes resultantes às listas
                if not df_merra_result.empty:
                    all_merra_dfs.append(df_merra_result)
                if not df_merra2_result.empty:
                    all_merra2_dfs.append(df_merra2_result)
                    
            except Exception as e:
                print(f"Erro ao processar a localização {location}: {e}")

    # 4. Consolida os resultados de todas as localizações em dois DataFrames finais
    final_df_merra = pd.DataFrame()
    if all_merra_dfs:
        final_df_merra = pd.concat(all_merra_dfs, ignore_index=True)

    final_df_merra2 = pd.DataFrame()
    if all_merra2_dfs:
        final_df_merra2 = pd.concat(all_merra2_dfs, ignore_index=True)
        
    return final_df_merra, final_df_merra2
    