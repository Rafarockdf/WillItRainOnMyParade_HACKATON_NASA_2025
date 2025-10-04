import os
import io
import pandas as pd
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
from ..config_env import Config


TIME_SERIES_URL = "https://api.giovanni.earthdata.nasa.gov/timeseries"

def call_time_series(lat, lon, time_start, time_end, data):
    query_parameters = {
        "data": data,
        "location": f"[{lat},{lon}]",
        "time": f"{time_start}/{time_end}"
    }
    headers = {"Authorization": f"Bearer {Config.GIOVANNI_TOKEN}"}
    response = requests.get(TIME_SERIES_URL, params=query_parameters, headers=headers)
    response.raise_for_status()  # Raise an exception for bad status codes
    return response.text

def parse_csv(ts):
    with io.StringIO(ts) as f:
        headers = {}
        for _ in range(13):
            line = f.readline()
            key, value = line.split(",", maxsplit=1)
            headers[key] = value.strip()

        df = pd.read_csv(
            f,
            header=1,
            names=("Timestamp", headers["param_short_name"]),
            converters={"Timestamp": pd.to_datetime}
        )
    return headers, df

def colect_variables(list_variables, lat, lon, time_start, time_end):
    df_completed = pd.DataFrame()

    def process_variable(data):
        ts = call_time_series(lat, lon, time_start, time_end, data)
        _, df_new = parse_csv(ts)
        return df_new

    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_df = {executor.submit(process_variable, data): data for data in list_variables}
        for future in tqdm(as_completed(future_to_df), total=len(future_to_df), desc=f"Processing variables for {lat},{lon}"):
            try:
                df_new = future.result()
                if df_completed.empty:
                    df_completed = df_new
                else:
                    df_completed = pd.merge(df_completed, df_new, on="Timestamp", how="inner")
            except Exception as e:
                print(f"Error processing variable for {lat},{lon}: {e}")

    df_completed['lat'] = lat
    df_completed['lon'] = lon
    return df_completed
