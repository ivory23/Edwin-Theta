import yaml
from pathlib import Path
from typing import Dict, Any
import os

from .migrations.migration_manager import MigrationManager

class ConfigManager:
    def __init__(self, config_path: str = None):
        self.config_path = config_path or "config.yaml"
        self.migration_manager = MigrationManager(self.config_path)
        self.config = self._load_config()
        self._validate_config()

    def _load_config(self) -> Dict:
        if not os.path.exists(self.config_path):
            self._create_default_config()
        
        with open(self.config_path, 'r') as file:
            config = yaml.safe_load(file)
            
        # Perform migration if needed
        backup_path = self.migration_manager.backup_config()
        migrated_config = self.migration_manager.migrate(config)
        
        if migrated_config != config:
            print(f"Configuration migrated. Backup saved to: {backup_path}")
            self._save_config(migrated_config)
            
        return migrated_config

    def _create_default_config(self):
        default_config = {
            'agent': {
                'name': 'Edwin Portfolio Manager',
                'version': '1.0.0',
                'rebalance_threshold': 0.05,
                'max_slippage': 0.01,
                'update_interval': 300
            },
            'risk': {
                'max_exposure': 0.3,
                'min_liquidity': 0.1,
                'max_drawdown': 0.2,
                'risk_tolerance': 'medium'
            },
            'protocols': {
                'uniswap': {
                    'enabled': True,
                    'version': 'v3',
                    'max_pool_share': 0.1
                },
                'aave': {
                    'enabled': True,
                    'version': 'v2',
                    'max_utilization': 0.8
                }
            },
            'assets': {
                'ETH': {
                    'enabled': True,
                    'max_allocation': 0.4,
                    'min_allocation': 0.1
                },
                'USDC': {
                    'enabled': True,
                    'max_allocation': 0.5,
                    'min_allocation': 0.2
                },
                'WBTC': {
                    'enabled': True,
                    'max_allocation': 0.3,
                    'min_allocation': 0.1
                }
            },
            'analytics': {
                'report_interval': 86400,
                'metrics': ['volatility', 'sharpe_ratio', 'drawdown']
            }
        }
        
        with open(self.config_path, 'w') as file:
            yaml.dump(default_config, file, default_flow_style=False)

    def _validate_config(self):
        required_sections = ['agent', 'risk', 'protocols', 'assets', 'analytics']
        for section in required_sections:
            if section not in self.config:
                raise ValueError(f"Missing required configuration section: {section}")

    def get(self, section: str, key: str = None, default: Any = None) -> Any:
        if key is None:
            return self.config.get(section, default)
        return self.config.get(section, {}).get(key, default)

    def update(self, section: str, key: str, value: Any):
        if section not in self.config:
            self.config[section] = {}
        self.config[section][key] = value
        self._save_config()

    def _save_config(self):
        with open(self.config_path, 'w') as file:
            yaml.dump(self.config, file, default_flow_style=False)