import os
from dotenv import load_dotenv
import logging
logging.basicConfig()
#logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Load environment variables from .env file
load_dotenv()

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DATA_DIR = os.getenv('DATA_DIR', 'data')
    AGENTS_DIR = os.path.join(os.getenv('DATA_DIR'), 'agents')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, DATA_DIR, 'sia.db')
    SECRET_KEY = os.getenv('SECRET_KEY')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '') # defaults to none
    HEADER_KEY = 'XteNATqxnbBkPa6TCHcK0NTxOM1JVkQl' # this key cannot be changed because it is sent from the react frontend
    LLM_SERVER_PORT = os.getenv('LLM_SERVER_PORT', 8001)
    EMBEDDINGS_SERVER_PORT = os.getenv('EMBEDDINGS_SERVER_PORT', 8000)
    OPENAPI_KEY = os.getenv('OPENAPI_KEY', 'None')
    LLM_MODEL_NAME = os.getenv('LLM_MODEL_NAME')