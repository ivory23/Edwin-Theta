import pytest
from decimal import Decimal
from src.agent.portfolio_agent import PortfolioAgent

@pytest.fixture
async def portfolio_agent():
    config = {
        'rebalance_threshold': Decimal('0.05'),
        'max_slippage': Decimal('0.01')
    }
    agent = PortfolioAgent(config)
    await agent.initialize()
    return agent

@pytest.mark.asyncio
async def test_portfolio_initialization(portfolio_agent):
    assert portfolio_agent.portfolio['total_value'] == Decimal('0')
    assert isinstance(portfolio_agent.portfolio['assets'], dict)

@pytest.mark.asyncio
async def test_target_allocation_setting(portfolio_agent):
    allocations = {
        'ETH': Decimal('0.4'),
        'USDC': Decimal('0.3'),
        'WBTC': Decimal('0.3')
    }
    await portfolio_agent.set_target_allocation(allocations)
    assert portfolio_agent.target_allocations == allocations

@pytest.mark.asyncio
async def test_rebalance_check(portfolio_agent):
    # Test implementation
    pass