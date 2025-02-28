class BaseAgent:
    def __init__(self, config=None):
        self.config = config or {}
        self.name = "Edwin"
        self.state = {}

    async def initialize(self):
        """Initialize the agent"""
        pass

    async def process(self, input_data):
        """Process input and return response"""
        raise NotImplementedError("Process method must be implemented")

    async def think(self, context):
        """Think about the current context and make decisions"""
        raise NotImplementedError("Think method must be implemented")

    async def act(self, decision):
        """Execute actions based on decisions"""
        raise NotImplementedError("Act method must be implemented")