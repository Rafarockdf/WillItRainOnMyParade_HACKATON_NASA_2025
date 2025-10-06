import psycopg2
import os

def get_db_connection():
    """
    Cria e retorna uma conexão com o banco de dados PostgreSQL usando variáveis de ambiente.
    """
    conn = psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=os.getenv('POSTGRES_PORT', '5432'),
        dbname=os.getenv('POSTGRES_DB', 'the-chess'),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'rafa7887')
    )
    return conn
