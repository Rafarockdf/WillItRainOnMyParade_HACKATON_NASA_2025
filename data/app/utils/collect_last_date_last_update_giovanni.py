import pandas as pd
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Sua função original para obter a data de referência local
def collect_last_update():
    """Retorna a data de referência para comparação."""
    return pd.to_datetime('2025-09-01')

def check_and_compare_last_data_view():
    """
    Verifica se a view 'last_data' existe no PostgreSQL.
    Se existir, compara seu valor com a data de 'collect_last_update'.
    """
    # Carrega as variáveis de ambiente do arquivo .env
    load_dotenv()

    # Monta a string de conexão a partir das variáveis de ambiente
    try:
        db_url = (
            f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
            f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
        )
        engine = create_engine(db_url)
    except Exception as e:
        print(f"Erro ao montar a URL de conexão. Verifique suas variáveis de ambiente. Erro: {e}")
        return

    view_name = 'last_data'
    schema_name = 'public' # Altere se a sua view estiver em um schema diferente

    try:
        # Usa um gerenciador de contexto para garantir que a conexão seja fechada
        with engine.connect() as connection:
            print("Conexão com o banco de dados PostgreSQL bem-sucedida.")

            # 1. Query para verificar se a view existe no information_schema
            check_view_query = text(f"""
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.views
                    WHERE table_schema = '{schema_name}'
                    AND table_name = '{view_name}'
                );
            """)
            
            view_exists = connection.execute(check_view_query).scalar()

            # 2. Lógica condicional baseada na existência da view
            if view_exists:
                print(f"A view '{view_name}' foi encontrada no schema '{schema_name}'.")

                # 3. Busca o valor da view
                select_value_query = text(f"SELECT * FROM {schema_name}.{view_name};")
                df_view = pd.read_sql(select_value_query, connection)

                if df_view.empty:
                    print(f"A view '{view_name}' existe, mas está vazia. Não há dados para comparar.")
                    return

                # Pega o valor da primeira linha e primeira coluna da view
                db_date_value = df_view.iloc[0, 0]
                db_timestamp = pd.to_datetime(db_date_value)
                
                # Pega o valor da função local
                local_timestamp = collect_last_update()
                
                print(f"Data no banco de dados: {db_timestamp.strftime('%Y-%m-%d')}")
                print(f"Data na função local:    {local_timestamp.strftime('%Y-%m-%d')}")

                # 4. Compara os valores
                if db_timestamp == local_timestamp:
                    print("\nResultado: As datas são IGUAIS.")
                else:
                    print("\nResultado: As datas são DIFERENTES.")

            else:
                print(f"A view '{view_name}' NÃO foi encontrada no schema '{schema_name}'.")

    except SQLAlchemyError as e:
        print(f"Ocorreu um erro de banco de dados: {e}")
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")

# --- Execução do Script ---
if __name__ == "__main__":
    check_and_compare_last_data_view()