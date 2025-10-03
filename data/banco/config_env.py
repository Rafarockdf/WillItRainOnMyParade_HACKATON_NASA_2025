# config_env.py
from dotenv import load_dotenv
import os

load_dotenv()  # procura .env no cwd ou caminho especificado

DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
TOKEN = os.getenv("TOKEN")
