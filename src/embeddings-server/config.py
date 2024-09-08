import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    BASE_DIR: str = os.path.abspath(os.path.dirname(__file__))
    DATA_DIR: str = os.getenv('DATA_DIR', 'data')
    AGENTS_DIR: str = os.path.join(os.getenv('DATA_DIR'), 'agents')
    MODELS_DIR: str = os.path.join(os.getenv('DATA_DIR'), 'models')
    STORE_DIR: str = os.path.join(os.getenv('DATA_DIR'), 'store')
    EMBEDDING_MODEL_NAME: str = os.getenv('EMBEDDING_MODEL_NAME', 'sentence-transformers/all-MiniLM-L6-v2')
    EMBEDDING_MODEL_FILENAME: str = os.getenv('EMBEDDING_MODEL_FILENAME','pytorch_model.bin') 
    HF_API_TOKEN: str = os.getenv('HF_API_TOKEN')
    CORS_ALLOWED_ORIGINS: str = os.getenv('CORS_ALLOWED_ORIGINS', '') # defaults to none
    HEADER_KEY: str = 'XteNATqxnbBkPa6TCHcK0NTxOM1JVkQl' # this key cannot be changed because it is sent from the react frontend

class Config:
    env_file = ".env"

# Create an instance of the Settings class to be used across the application
settings = Settings()