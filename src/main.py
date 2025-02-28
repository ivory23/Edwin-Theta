import asyncio
from decimal import Decimal
from agent.portfolio_agent import PortfolioAgent
from protocols.uniswap import UniswapProtocol
from protocols.aave import AaveProtocol
from risk.risk_manager import RiskManager
from analytics.portfolio_analytics import PortfolioAnalytics
from config.config_manager import ConfigManager
from config.env_loader import EnvLoader

async def initialize_system():
    # Load environment variables
    env_loader = EnvLoader()
    env_vars = env_loader.get_required_vars()

    # Load configuration
    config_manager = ConfigManager()
    
    # Initialize components with configuration
    agent_config = config_manager.get('agent')
    risk_config = config_manager.get('risk')
    protocol_config = config_manager.get('protocols')
    
    # Initialize agent and other components...
    
async def main():
    await initialize_system()
    # Initialize components
    config = {
        'rebalance_threshold': Decimal('0.05'),
        'max_slippage': Decimal('0.01'),
        'max_exposure': Decimal('0.3'),
        'min_liquidity': Decimal('0.1')
    }
    
    agent = PortfolioAgent(config)
    risk_manager = RiskManager(config)
    analytics = PortfolioAnalytics()
    
    # Initialize protocols
    uniswap = UniswapProtocol({'version': 'v3'})
    aave = AaveProtocol({'version': 'v2'})
    
    # Set up portfolio
    await agent.initialize()
    await agent.add_protocol('uniswap', uniswap)
    await agent.add_protocol('aave', aave)
    
    # Set target allocations
    target_allocations = {
        'ETH': Decimal('0.4'),
        'USDC': Decimal('0.3'),
        'WBTC': Decimal('0.3')
    }
    await agent.set_target_allocation(target_allocations)
    
    # Main loop
    while True:
        try:
            # Update portfolio and check for rebalancing
            result = await agent.process({})
            
            # Risk assessment
            risk_metrics = await risk_manager.calculate_portfolio_risk(agent.portfolio)
            
            # Update analytics
            await analytics.add_snapshot({
                'portfolio': agent.portfolio,
                'risk_metrics': risk_metrics
            })
            
            # Generate report every 24 hours
            report = await analytics.generate_report()
            
            await asyncio.sleep(300)  # 5-minute interval
            
        except Exception as e:
            print(f"Error in main loop: {e}")
            await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(main())