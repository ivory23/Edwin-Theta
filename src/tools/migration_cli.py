import click
import yaml
from pathlib import Path
from src.config.migrations.migration_manager import MigrationManager
from src.config.validation import ConfigValidator

@click.group()
def cli():
    """Edwin Configuration Migration Tool"""
    pass

@cli.command()
@click.argument('config_path', type=click.Path(exists=True))
def migrate(config_path):
    """Migrate configuration to latest version"""
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
            
        migration_manager = MigrationManager(config_path)
        migrated_config = migration_manager.migrate(config)
        
        click.echo(f"Migration completed successfully.")
        click.echo(f"New version: {migrated_config['agent']['version']}")
        
    except Exception as e:
        click.echo(f"Migration failed: {str(e)}", err=True)

@cli.command()
@click.argument('config_path', type=click.Path(exists=True))
def validate(config_path):
    """Validate configuration file"""
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
            
        validator = ConfigValidator()
        validator.validate_config(config)
        click.echo("Configuration is valid.")
        
    except Exception as e:
        click.echo(f"Validation failed: {str(e)}", err=True)

@cli.command()
def history():
    """Show migration history"""
    migration_manager = MigrationManager("config.yaml")
    history = migration_manager._load_history()
    
    for entry in history:
        click.echo(f"[{entry['timestamp']}] {entry['from_version']} -> "
                  f"{entry['to_version']}: {entry['status']}")
        if entry.get('error'):
            click.echo(f"  Error: {entry['error']}")

if __name__ == '__main__':
    cli()