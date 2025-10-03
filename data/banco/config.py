import psycopg2
from config_env import DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME


try:
    # Tente estabelecer a conexão
    conn = psycopg2.connect(
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST, # Ou o endereço IP do seu servidor PostgreSQL
        port=DB_PORT,
        options='-c client_encoding=UTF8'# A porta padrão, pode ser alterada se necessário
    )
    conn.set_client_encoding('LATIN1')

    print("Conectado ao PostgreSQL com sucesso!")
    
    # Crie um cursor para executar comandos
    cur = conn.cursor()

    # Exemplo: execute uma consulta
    cur.execute("SELECT version();")
    db_version = cur.fetchone()
    print(f"Versão do banco de dados: {db_version}")

    # Faça outras operações com o banco de dados...

except psycopg2.OperationalError as e:
    print(f"Erro ao conectar ao PostgreSQL: {e}")
except Exception as e:
    print(f"Um erro inesperado ocorreu: {e}")
finally:
    # Garanta que a conexão e o cursor sejam fechados ao final
    if 'cur' in locals() and cur is not None:
        cur.close()
    if 'conn' in locals() and conn is not None:
        conn.close()
        print("Conexão com PostgreSQL fechada.")