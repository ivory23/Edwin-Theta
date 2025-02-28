from typing import Dict, Any
from jsonschema import validate, ValidationError

class ConfigValidator:
    @staticmethod
    def validate_config(config: Dict) -> bool:
        schema = {
            "type": "object",
            "required": ["agent", "risk", "protocols", "assets"],
            "properties": {
                "agent": {
                    "type": "object",
                    "required": ["name", "version"],
                    "properties": {
                        "name": {"type": "string"},
                        "version": {"type": "string"},
                        "rebalance_threshold": {"type": "number"}
                    }
                },
                "risk": {
                    "type": "object",
                    "required": ["max_exposure"],
                    "properties": {
                        "max_exposure": {"type": "number"},
                        "risk_metrics": {"type": "object"}
                    }
                },
                "protocols": {
                    "type": "object",
                    "additionalProperties": {
                        "type": "object",
                        "required": ["enabled"],
                        "properties": {
                            "enabled": {"type": "boolean"}
                        }
                    }
                }
            }
        }
        
        try:
            validate(instance=config, schema=schema)
            return True
        except ValidationError as e:
            raise ValueError(f"Configuration validation failed: {str(e)}")