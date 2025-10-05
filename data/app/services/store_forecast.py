import psycopg2
import json
import pickle
from app.config_env import Config

def get_db_connection():
    DB_HOST = Config.DB_HOST or 'localhost'
    DB_PORT = Config.DB_PORT or '5433'
    DB_NAME = Config.DB_NAME or 'the-chess'
    DB_USER = Config.DB_USER or 'postgres'
    DB_PASS = Config.DB_PASS or 'rafa7887'
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    return conn

def buscar_previsao_no_banco(lat, lon, date):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT resultado FROM previsoes WHERE lat=%s AND lon=%s AND data=%s
        """,
        (lat, lon, date)
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row and row[0]:
        return json.loads(row[0])
    return None

def salvar_previsao_no_banco(lat, lon, date, resultado_json):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO previsoes (lat, lon, data, resultado)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (lat, lon, data) DO UPDATE SET resultado = EXCLUDED.resultado
        """,
        (lat, lon, date, json.dumps(resultado_json))
    )
    conn.commit()
    cursor.close()
    conn.close()

def salvar_modelo_no_banco(lat, lon, tipo, modelo):
    """
    Serializa e salva o modelo Prophet treinado no banco de dados PostgreSQL.
    Args:
        lat (float): Latitude do local
        lon (float): Longitude do local
        tipo (str): Tipo do modelo (ex: 'temperature', 'humidity', etc)
        modelo (Prophet): Objeto Prophet treinado
    """
    modelo_serializado = pickle.dumps(modelo)
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO modelos_treinados (lat, lon, tipo, modelo_pickle)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (lat, lon, tipo)
                DO UPDATE SET modelo_pickle = EXCLUDED.modelo_pickle;
            ''', (lat, lon, tipo, modelo_serializado))
        conn.commit()
    finally:
        conn.close()

def buscar_modelo_no_banco(lat, lon, tipo):
    """
    Busca e desserializa o modelo Prophet treinado do banco de dados PostgreSQL.
    Args:
        lat (float): Latitude do local
        lon (float): Longitude do local
        tipo (str): Tipo do modelo (ex: 'temperature', 'humidity', etc)
    Returns:
        Prophet ou None: Objeto Prophet treinado ou None se não encontrado
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT modelo_pickle FROM modelos_treinados
                WHERE lat = %s AND lon = %s AND tipo = %s
            ''', (lat, lon, tipo))
            result = cur.fetchone()
            if result and result[0]:
                return pickle.loads(result[0])
    finally:
        conn.close()
    return None

def salvar_dados_historicos(lat, lon, df_local):
    """
    Salva os dados históricos de uma localização na tabela 'historico_localizacao'.
    Cada linha do DataFrame é inserida como um registro.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    for _, row in df_local.iterrows():
        cursor.execute(
            """
            INSERT INTO historico_localizacao (lat, lon, timestamp_local, tlml, qlml, speedlml, prectotcorr, tqv)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (lat, lon, timestamp_local) DO NOTHING
            """,
            (
                row['lat'], row['lon'], row['Timestamp_Local'],
                row.get('TLML'), row.get('QLML'), row.get('SPEEDLML'),
                row.get('PRECTOTCORR'), row.get('TQV')
            )
        )
    conn.commit()
    cursor.close()
    conn.close()

# No modelo.py, após filtrar df_local, chame:
# salvar_dados_historicos(lat, lon, df_local)
# Só retreine o modelo se df_local tiver dados novos (compare com o histórico)
