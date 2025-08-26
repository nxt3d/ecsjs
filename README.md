# ECS Resolver


[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript library for resolving **ECS (Ethereum Credential Service)** credentials using [Viem](https://viem.sh/). This library provides a simple, type-safe interface to query credentials stored in the ECS system through ENS (Ethereum Name Service) text records.

## What is ECS?

ECS (Ethereum Credential Service) is a decentralized protocol built on Ethereum for storing, retrieving, and verifying digital credentials. It enables applications to create custom credentials with guaranteed namespace ownership and flexible on-chain/off-chain data storage.

**⚠️ Important**: ECS is currently deployed on **Ethereum Sepolia testnet** only. This library is designed to work with the testnet deployment.

**Example**: Query how many "stars" `vitalik.eth` has received using the credential `eth.ecs.ethstars.stars` (currently returns "2" on Sepolia testnet).

## Features

- 🚀 **Simple Interface**: Easy-to-use methods for resolving credentials
- 🔧 **Viem Integration**: Built on top of the popular Viem library
- 📝 **TypeScript Support**: Full type safety and IntelliSense
- 🎯 **Multiple Identifier Types**: Support for both name-based and address-based credentials
- 🔄 **Batch Resolution**: Resolve multiple credentials efficiently
- ⚡ **Error Handling**: Comprehensive error handling with custom error types
- 🧪 **Well Tested**: 35 unit tests with 86.5% code coverage
- 📦 **Dual Package**: Supports both CommonJS and ES modules

## Installation

Since this library is not yet published to npm, you can install it directly from the repository:

```bash
npm install git+https://github.com/your-org/ecs-resolver.git viem
```

Or clone and install locally:

```bash
git clone https://github.com/your-org/ecs-resolver.git
cd ecs-resolver
npm install
```

**Note**: `viem` is a peer dependency and must be installed separately.

## Quick Start

```typescript
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { createECSResolver } from 'ecs-resolver'

// Create a Viem public client
const publicClient = createPublicClient({
  chain: sepolia, // ECS is currently deployed on Sepolia testnet
  transport: http('https://rpc.sepolia.org')
})

// Create the ECS resolver
const resolver = createECSResolver({ publicClient })

// Resolve a name-based credential
const result = await resolver.resolveNameCredential(
  'vitalik.eth',
  'eth.ecs.ethstars.stars'
)

console.log(result.value) // e.g., "2"
```

## How ECS Works

ECS uses ENS to resolve credentials by constructing special ENS names:

### Name-based Credentials
For ENS names or DNS domains:
```
{name}.name.ecs.eth
```
**Example**: `vitalik.eth.name.ecs.eth`

### Address-based Credentials
For Ethereum addresses:
```
{address}.{coinType}.addr.ecs.eth
```
**Example**: `d8da6bf26964af9d7eed9e03e53415d37aa96045.3c.addr.ecs.eth`

The library then queries these ENS names for text records using the credential key (e.g., `eth.ecs.ethstars.stars`).

## API Reference

### Creating a Resolver

#### `createECSResolver(config)`

Creates a new ECS resolver instance.

```typescript
import { createECSResolver } from 'ecs-resolver'

const resolver = createECSResolver({
  publicClient,           // Viem PublicClient (required)
  ecsDomain: 'ecs.eth'   // Custom ECS domain (optional, defaults to 'ecs.eth')
})
```

### Resolving Credentials

#### `resolveNameCredential(name, credentialKey, options?)`

Resolves a credential for an ENS name or DNS domain.

```typescript
const result = await resolver.resolveNameCredential(
  'vitalik.eth',
  'eth.ecs.ethstars.stars',
  {
    timeout: 10000,      // Timeout in ms (default: 10000)
    throwOnError: false  // Whether to throw on errors (default: false)
  }
)

console.log(result)
// {
//   value: "2",
//   ensName: "vitalik.eth.name.ecs.eth",
//   credentialKey: "eth.ecs.ethstars.stars",
//   success: true
// }
```

#### `resolveAddressCredential(address, credentialKey, coinType?, options?)`

Resolves a credential for an Ethereum address.

```typescript
const result = await resolver.resolveAddressCredential(
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  'eth.ecs.ethstars.stars',
  '3c' // Coin type (optional, defaults to '3c' for Ethereum)
)
```

#### `resolveCredential(identifier, credentialKey, options?)`

Generic method that works with both name and address identifiers.

```typescript
// Name-based
const nameResult = await resolver.resolveCredential(
  { type: 'name', name: 'vitalik.eth' },
  'eth.ecs.ethstars.stars'
)

// Address-based
const addressResult = await resolver.resolveCredential(
  { 
    type: 'address', 
    address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    coinType: '3c'
  },
  'eth.ecs.ethstars.stars'
)
```

#### `resolveCredentialsBatch(requests, options?)`

Resolves multiple credentials in parallel.

```typescript
const requests = [
  {
    identifier: { type: 'name', name: 'vitalik.eth' },
    credentialKey: 'eth.ecs.ethstars.stars'
  },
  {
    identifier: { type: 'name', name: 'ethereum.eth' },
    credentialKey: 'eth.ecs.ethstars.stars'
  }
]

const results = await resolver.resolveCredentialsBatch(requests)
```

### Utility Methods

#### `getCredentialMetadata(credentialKey)`

Parses a credential key into its components.

```typescript
const metadata = resolver.getCredentialMetadata('eth.ecs.ethstars.stars')
// {
//   key: 'eth.ecs.ethstars.stars',
//   namespace: 'ethstars',
//   name: 'stars'
// }
```

#### `getENSName(identifier)`

Gets the ENS name that would be used for resolution.

```typescript
const ensName = resolver.getENSName({ type: 'name', name: 'vitalik.eth' })
// "vitalik.eth.name.ecs.eth"
```

## Utility Functions

The library also exports utility functions for working with identifiers and credential keys:

```typescript
import {
  createNameIdentifier,
  createAddressIdentifier,
  normalizeAddress,
  normalizeName,
  constructENSName,
  parseCredentialKey,
  validateCredentialKey
} from 'ecs-resolver'

// Create identifiers
const nameId = createNameIdentifier('vitalik.eth')
const addressId = createAddressIdentifier('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')

// Normalize inputs
const normalizedAddr = normalizeAddress('0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045')
// "d8da6bf26964af9d7eed9e03e53415d37aa96045"

// Construct ENS names
const ensName = constructENSName(nameId)
// "vitalik.eth.name.ecs.eth"

// Parse credential keys
const metadata = parseCredentialKey('eth.ecs.ethstars.stars')
// { key: '...', namespace: 'ethstars', name: 'stars' }
```

## Error Handling

The library provides comprehensive error handling with custom error types:

```typescript
import {
  ECSError,
  InvalidIdentifierError,
  InvalidCredentialKeyError,
  ResolutionTimeoutError,
  ENSResolutionError
} from 'ecs-resolver'

try {
  const result = await resolver.resolveNameCredential(
    'vitalik.eth',
    'eth.ecs.ethstars.stars',
    { throwOnError: true }
  )
} catch (error) {
  if (error instanceof InvalidIdentifierError) {
    console.log('Invalid identifier:', error.message)
  } else if (error instanceof ENSResolutionError) {
    console.log('ENS resolution failed:', error.message)
  }
  // ... handle other error types
}
```

By default, errors are handled gracefully and returned in the result object:

```typescript
const result = await resolver.resolveNameCredential(
  'nonexistent.eth',
  'eth.ecs.ethstars.stars'
)

if (!result.success) {
  console.log('Resolution failed:', result.error)
}
```

## Supported Coin Types

For address-based credentials, the following coin types are supported:

| Coin Type | Blockchain | Hex Value |
|-----------|------------|-----------|
| Ethereum  | ETH        | `3c`      |
| Bitcoin   | BTC        | `0`       |
| Litecoin  | LTC        | `2`       |
| Bitcoin Cash | BCH     | `91`      |

## Examples

### Basic Usage

```typescript
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { createECSResolver } from 'ecs-resolver'

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
})

const resolver = createECSResolver({ publicClient })

// Resolve name-based credential
const nameResult = await resolver.resolveNameCredential(
  'vitalik.eth',
  'eth.ecs.ethstars.stars'
)

// Resolve address-based credential  
const addressResult = await resolver.resolveAddressCredential(
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  'eth.ecs.ethstars.stars'
)

console.log('Name stars:', nameResult.value)
console.log('Address stars:', addressResult.value)
```

### Batch Resolution

```typescript
const requests = [
  {
    identifier: { type: 'name', name: 'vitalik.eth' },
    credentialKey: 'eth.ecs.ethstars.stars'
  },
  {
    identifier: { type: 'name', name: 'ethereum.eth' },
    credentialKey: 'eth.ecs.ethstars.stars'
  }
]

const results = await resolver.resolveCredentialsBatch(requests)

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Request ${index + 1}: ${result.value} stars`)
  } else {
    console.log(`Request ${index + 1}: Failed - ${result.error}`)
  }
})
```

### Custom Configuration

```typescript
// Use mainnet with custom timeout
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth-mainnet.g.alchemy.com/v2/your-api-key')
})

const resolver = createECSResolver({ 
  publicClient: mainnetClient,
  ecsDomain: 'ecs.eth'
})

const result = await resolver.resolveNameCredential(
  'vitalik.eth',
  'eth.ecs.ethstars.stars',
  { 
    timeout: 5000,
    throwOnError: true
  }
)
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Unit tests
npm test
npm run test:watch
npm run test:coverage

# Onchain tests (requires .env with SEPOLIA_RPC_URL)
npm run test:onchain
```

### Test Structure

```
ecs-resolver/
├── src/                    # Source code
├── tests/                  # All tests
│   ├── utils.test.ts      # Unit tests for utilities
│   ├── resolver.test.ts   # Unit tests for resolver
│   └── onchain.test.js    # Onchain tests with real ECS credentials
└── examples/              # Usage examples
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## ECS Deployment

ECS is currently deployed on the **Sepolia testnet**. For production use, you'll need to wait for mainnet deployment or deploy your own instance.

### Sepolia Testnet Contracts

| Contract | Address | Etherscan |
|----------|---------|-----------|
| ECSRegistry | `0x360728b13Dfc832333beF3E4171dd42BdfCedC92` | [View](https://sepolia.etherscan.io/address/0x360728b13Dfc832333beF3E4171dd42BdfCedC92) |
| ECSNameResolver | `0xa8e8443f3bbaf7c903764cbc9602134a6bfec2b2` | [View](https://sepolia.etherscan.io/address/0xa8e8443f3bbaf7c903764cbc9602134a6bfec2b2) |
| ECSAddressResolver | `0x2ffdf34ed40171cce860020ea37c9f1854e0995e` | [View](https://sepolia.etherscan.io/address/0x2ffdf34ed40171cce860020ea37c9f1854e0995e) |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [ECS Protocol Repository](https://github.com/nxt3d/ecs)
- [Viem Documentation](https://viem.sh/)
- [ENS Documentation](https://docs.ens.domains/)

---

**Note**: ECS is currently in beta on Ethereum Sepolia testnet. The library has been tested with real credentials and works correctly. Use at your own risk in production environments.
