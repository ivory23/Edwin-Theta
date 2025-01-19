# Edwin SDK

Edwin is a TypeScript SDK for integrating AI agents with DeFi protocols. It provides a simple interface for AI agents to interact with various DeFi operations like lending, borrowing, and liquidity provision.

## Installation

```bash
pnpm install edwin
```

## Features

- Lending/Borrowing operations
- Liquidity provision
- Cross-chain support
- Type-safe protocol interactions
- AI-friendly templates

## Quick Start

```typescript
import { Edwin } from 'edwin-sdk';
// Initialize the SDK
const edwin = new Edwin({
privateKey: process.env.PRIVATE_KEY,
rpcUrl: process.env.RPC_URL
});
// Supply tokens to a lending protocol
await edwin.lending.supply({
chain: 'ethereum',
protocol: 'aave',
amount: '100',
asset: 'USDC'
});

import { Edwin } from 'edwin';

const edwin = new Edwin();
```


## Documentation

For detailed documentation, visit [docs.edwin.finance](https://docs.edwin.finance)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT