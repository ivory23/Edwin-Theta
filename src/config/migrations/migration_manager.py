from typing import Dict, List
import yaml
import shutil
from datetime import datetime
from pathlib import Path

class MigrationManager:
    def __init__(self, config_path: str):
        self.config_path = Path(config_path)
        self.backup_dir = Path("config_backups")
        self.history_file = Path("config_migrations/history.json")
        self.backup_dir.mkdir(exist_ok=True)
        Path("config_migrations").mkdir(exist_ok=True)
        
    def migrate(self, current_config: Dict) -> Dict:
        current_version = self._get_config_version(current_config)
        latest_version = "3.0.0"
        
        if current_version == latest_version:
            return current_config
            
        backup_path = self.backup_config()
        try:
            migrations = self._get_migration_path(current_version, latest_version)
            migrated_config = current_config
            
            for migration_func, target_version in migrations:
                migrated_config = migration_func(migrated_config)
                migrated_config['agent']['version'] = target_version
                self._log_migration(current_version, target_version, MigrationStatus.SUCCESS)
                current_version = target_version
                
            return migrated_config
            
        except Exception as e:
            self._log_migration(current_version, latest_version, MigrationStatus.FAILED, str(e))
            return self.rollback(backup_path)

    def rollback(self, backup_path: str) -> Dict:
        with open(backup_path, 'r') as f:
            config = yaml.safe_load(f)
        self._save_config(config)
        current_version = self._get_config_version(config)
        self._log_migration(current_version, current_version, MigrationStatus.ROLLED_BACK)
        return config

    def _get_migration_path(self, current_version: str, target_version: str) -> List:
        migrations = []
        if current_version == "1.0.0":
            migrations.append((self._migrate_1_0_0_to_2_0_0, "2.0.0"))
        if current_version <= "2.0.0" and target_version >= "2.5.0":
            migrations.append((self._migrate_2_0_0_to_2_5_0, "2.5.0"))
        if current_version <= "2.5.0" and target_version >= "3.0.0":
            migrations.append((self._migrate_2_5_0_to_3_0_0, "3.0.0"))
        return migrations

    def _migrate_1_0_0_to_2_0_0(self, config: Dict) -> Dict:
        """Migrate from version 1.0.0 to 2.0.0"""
        # Create new config structure
        new_config = config.copy()
        
        # Add new sections
        new_config.setdefault('security', {
            'max_gas_price': 100,
            'trusted_addresses': [],
            'emergency_shutdown': False
        })
        
        # Update protocol configurations
        for protocol in new_config['protocols'].values():
            protocol['retry_attempts'] = 3
            protocol['timeout'] = 30
            
        # Update risk configuration
        new_config['risk']['risk_metrics'] = {
            'var_confidence': 0.95,
            'stress_test_scenarios': ['bull', 'bear', 'crab']
        }
        
        return new_config