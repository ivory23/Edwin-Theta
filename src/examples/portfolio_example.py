async def main():
    # Initialize agent
    config = {
        'rebalance_threshold': 0.05,
        'max_slippage': 0.01
    }
    agent = PortfolioAgent(config)
    await agent.initialize()

    # Add protocols
    await agent.add_protocol('uniswap', {
        'type': 'dex',
        'version': 'v3'
    })
    await agent.add_protocol('aave', {
        'type': 'lending',
        'version': 'v2'
    })

    # Set target allocations
    target_allocations = {
        'ETH': Decimal('0.4'),
        'USDC': Decimal('0.3'),
        'WBTC': Decimal('0.3')
    }
    await agent.set_target_allocation(target_allocations)

    # Process market data and rebalance if needed
    market_data = {
        'market_conditions': {
            'trend': 'bullish',
            'volatility': 'low'
        }
    }
    result = await agent.process(market_data)
    print(f"Processing result: {result}")

if __name__ == "__main__":
    asyncio.run(main())