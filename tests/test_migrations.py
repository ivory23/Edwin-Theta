import pytest
from src.config.migrations.migration_manager import MigrationManager, MigrationStatus
from src.config.validation import ConfigValidator
import json
from pathlib import Path
import yaml

@pytest.fixture
def sample_v1_config():
    return {
        'agent': {
            'name': 'Edwin Portfolio Manager',
            'version': '1.0.0',
            'rebalance_threshold': 0.05
        },
        'protocols': {
            'uniswap': {
                'enabled': True,
                'version': 'v3'
            }
        },
        'risk': {
            'max_exposure': 0.3
        }
    }

def test_migration_1_0_0_to_2_0_0(sample_v1_config, tmp_path):
    config_file = tmp_path / "config.yaml"
    with open(config_file, 'w') as f:
        yaml.dump(sample_v1_config, f)
        
    migration_manager = MigrationManager(str(config_file))
    migrated_config = migration_manager.migrate(sample_v1_config)
    
    assert migrated_config['agent']['version'] == '2.0.0'
    assert 'security' in migrated_config
    assert 'retry_attempts' in migrated_config['protocols']['uniswap']
    assert 'risk_metrics' in migrated_config['risk']

@pytest.fixture
def sample_v2_config():
    return {
        'agent': {
            'name': 'Edwin Portfolio Manager',
            'version': '2.0.0',
            'rebalance_threshold': 0.05
        },
        'protocols': {
            'uniswap': {
                'enabled': True,
                'version': 'v3',
                'retry_attempts': 3
            }
        },
        'risk': {
            'max_exposure': 0.3,
            'risk_metrics': {
                'var_confidence': 0.95
            }
        }
    }

def test_migration_2_0_0_to_2_5_0(sample_v2_config, tmp_path):
    config_file = tmp_path / "config.yaml"
    with open(config_file, 'w') as f:
        yaml.dump(sample_v2_config, f)
        
    migration_manager = MigrationManager(str(config_file))
    migrated_config = migration_manager.migrate(sample_v2_config)
    
    assert migrated_config['agent']['version'] == '2.5.0'
    assert 'networks' in migrated_config
    assert 'advanced_metrics' in migrated_config['risk']

def test_migration_history(sample_v2_config, tmp_path):
    config_file = tmp_path / "config.yaml"
    with open(config_file, 'w') as f:
        yaml.dump(sample_v2_config, f)
        
    migration_manager = MigrationManager(str(config_file))
    migration_manager.migrate(sample_v2_config)
    
    history = migration_manager._load_history()
    assert len(history) > 0
    assert history[-1]['status'] == MigrationStatus.SUCCESS.value

def test_config_validation(sample_v2_config):
    validator = ConfigValidator()
    assert validator.validate_config(sample_v2_config) == True
def test_backup_creation(sample_v1_config, tmp_path):
    config_file = tmp_path / "config.yaml"
    with open(config_file, 'w') as f:
        yaml.dump(sample_v1_config, f)
        
    migration_manager = MigrationManager(str(config_file))
    backup_path = migration_manager.backup_config()
    
    assert Path(backup_path).exists()