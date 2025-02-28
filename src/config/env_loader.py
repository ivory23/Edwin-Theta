import os
from dotenv import load_dotenv
from typing import Dict

class EnvLoader:
    def __init__(self, env_path: str = None):
        self.env_path = env_path or ".env"
        load_dotenv(self.env_path)

    def get_required_vars(self) -> Dict[str, str]:
        required_vars = {
            'UNISWAP_RPC_URL': os.getenv('UNISWAP_RPC_URL'),
            'UNISWAP_API_KEY': os.getenv('UNISWAP_API_KEY'),
            'AAVE_RPC_URL': os.getenv('AAVE_RPC_URL'),
            'AAVE_API_KEY': os.getenv('AAVE_API_KEY')
        }

        missing_vars = [key for key, value in required_vars.items() if not value]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

        return required_vars