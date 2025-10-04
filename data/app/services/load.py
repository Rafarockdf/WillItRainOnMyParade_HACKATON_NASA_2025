import os
from sqlalchemy import create_engine
from dotenv import load_dotenv
from config_env import DB_HOST, DB_PASS, DB_PORT, DB_NAME,DB_USER
def get_db_engine():
    conn_string = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    return create_engine(conn_string)

def load_data_to_db(df, table_name):
    """Carrega um DataFrame para uma tabela no banco de dados."""
    if df.empty:
        print("Nenhum dado para carregar.")
        return

    try:
        engine = get_db_engine()
        # if_exists='append': adiciona os dados. 'replace': apaga e recria a tabela.
        df.to_sql(table_name, engine, if_exists='append', index=False)
        print(f"Dados carregados com sucesso na tabela '{table_name}'.")
    except Exception as e:
        print(f"Erro ao carregar dados para o banco: {e}")