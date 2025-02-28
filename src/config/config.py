class Config:
    def __init__(self):
        self.settings = {
            "agent_name": "Edwin",
            "version": "0.1.0",
            "description": "Edwin AI Agent",
            "max_retries": 3,
            "timeout": 30
        }

    def get(self, key, default=None):
        return self.settings.get(key, default)

    def set(self, key, value):
        self.settings[key] = value