# ecs.js


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

- 📦 **Dual Package**: Supports both CommonJS and ES modules

## Installation

Install the package from npm:

```bash
npm install ecs-js
```

**Note**: `viem` is a peer dependency and will be installed automatically if not already present.

## Quick Start

### Main API

```typescript
import { createECSResolver } from 'ecs-js'

// Simple mode - just specify the network
const resolver = createECSResolver({ network: 'sepolia' })

// Resolve by name
const stars = await resolver.resolve('vitalik.eth', 'eth.ecs.ethstars.stars')
console.log(stars) // e.g., "2"

// Resolve by address
const addressStars = await resolver.resolveAddress(
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  'eth.ecs.ethstars.stars'
)
console.log(addressStars) // e.g., "2"

// Advanced mode - use your existing viem client
const advancedResolver = createECSResolver({ publicClient })

// Get detailed results
const details = await advancedResolver.resolveWithDetails('vitalik.eth', 'eth.ecs.ethstars.stars')
console.log(details) // { value: "2", ensName: "...", success: true }
```

**Note**: For production use, provide your own RPC URL. The library doesn't load environment variables - that's your responsibility:
```typescript
import 'dotenv/config' // Load environment variables in your app
const resolver = createECSResolver({ 
  network: 'sepolia',
  rpcUrl: process.env.SEPOLIA_RPC_URL 
})
```

## Usage

### Main API

#### `createECSResolver(config)`

Creates an ECS resolver that adapts based on your configuration.

```typescript
import { createECSResolver } from 'ecs-js'

// Simple mode - just specify the network
const resolver = createECSResolver({ network: 'sepolia' })

// With custom RPC URL
const resolver = createECSResolver({ 
  network: 'sepolia',
  rpcUrl: process.env.SEPOLIA_RPC_URL // Load environment variables in your app
})

// Advanced mode - use your existing viem client
const resolver = createECSResolver({ publicClient })
```

#### Resolver Methods

```typescript
// Simple methods (return string | null)
const stars = await resolver.resolve('vitalik.eth', 'eth.ecs.ethstars.stars')
const addressStars = await resolver.resolveAddress(
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  'eth.ecs.ethstars.stars'
)

// Advanced methods (return full result objects)
const details = await resolver.resolveWithDetails('vitalik.eth', 'eth.ecs.ethstars.stars')
// Returns: { value: "2", ensName: "...", credentialKey: "...", success: true }

const addressDetails = await resolver.resolveAddressWithDetails(
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  'eth.ecs.ethstars.stars'
)

// Batch operations for efficiency
const batchResults = await resolver.resolveBatch([
  { name: 'vitalik.eth', credential: 'eth.ecs.ethstars.stars' },
  { name: 'alice.eth', credential: 'eth.ecs.ethstars.stars' }
])

const addressBatchResults = await resolver.resolveAddressBatch([
  { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', credential: 'eth.ecs.ethstars.stars' }
])

// Utility methods
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
  validateCredentialKey
} from 'ecs-js'

// Create identifiers
const nameId = createNameIdentifier('vitalik.eth')
const addressId = createAddressIdentifier('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')

// Normalize inputs
const normalizedAddr = normalizeAddress('0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045')
// "d8da6bf26964af9d7eed9e03e53415d37aa96045"

// Construct ECS ENS names
const ensName = constructENSName(nameId)
// "vitalik.eth.name.ecs.eth"


```

## Error Handling

The library provides comprehensive error handling with both simple and detailed result methods:

### Simple Error Handling

```typescript
import { createECSResolver } from 'ecs-js'

const resolver = createECSResolver({ network: 'sepolia' })

// Simple methods return null for failed resolution
const result = await resolver.resolve('nonexistent.eth', 'eth.ecs.ethstars.stars')
if (result === null) {
  console.log('Credential not found')
}

// Get detailed error information
const details = await resolver.resolveWithDetails('nonexistent.eth', 'eth.ecs.ethstars.stars')
if (!details.success) {
  console.log('Error:', details.error)
}
```

### Advanced Error Handling

```typescript
import {
  ECSError,
  InvalidIdentifierError,
  InvalidCredentialKeyError,
  ResolutionTimeoutError,
  ENSResolutionError
} from 'ecs-js'

try {
  const result = await resolver.resolveWithDetails(
    'vitalik.eth',
    'eth.ecs.ethstars.stars'
  )
  if (!result.success) {
    console.log('Resolution failed:', result.error)
  }
} catch (error) {
  if (error instanceof InvalidIdentifierError) {
    console.log('Invalid identifier:', error.message)
  } else if (error instanceof ENSResolutionError) {
    console.log('ENS resolution failed:', error.message)
  }
  // ... handle other error types
}
```

## Examples

### Basic Usage

```typescript
import 'dotenv/config'
import { createECSResolver } from 'ecs-js'

// Create a resolver in simple mode
const resolver = createECSResolver({ network: 'sepolia' })

// Resolve by name
const stars = await resolver.resolve('vitalik.eth', 'eth.ecs.ethstars.stars')

// Resolve by address
const addressStars = await resolver.resolveAddress(
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  'eth.ecs.ethstars.stars'
)

console.log('Stars:', stars)
console.log('Address stars:', addressStars)
```

### Advanced Usage

```typescript
import 'dotenv/config'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { createECSResolver } from 'ecs-js'

// Custom viem configuration
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo')
})

// Advanced resolver with custom options
const resolver = createECSResolver({ 
  publicClient,
  ecsDomain: 'custom.ecs.eth' // Custom ECS domain
})

// Get detailed results
const nameResult = await resolver.resolveWithDetails(
  'vitalik.eth',
  'eth.ecs.ethstars.stars'
)

const addressResult = await resolver.resolveAddressWithDetails(
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  'eth.ecs.ethstars.stars'
)

console.log('Name stars:', nameResult.value)
console.log('Address stars:', addressResult.value)
```

### Batch Resolution

```typescript
// Resolve multiple credentials efficiently
const batchResults = await resolver.resolveBatch([
  { name: 'vitalik.eth', credential: 'eth.ecs.ethstars.stars' },
  { name: 'alice.eth', credential: 'eth.ecs.ethstars.stars' }
])

batchResults.forEach((result, index) => {
  if (result !== null) {
    console.log(`Request ${index + 1}: ${result} stars`)
  } else {
    console.log(`Request ${index + 1}: Failed`)
  }
})
```

### Custom Configuration

```typescript
// Use your existing viem client
const resolver = createECSResolver({ 
  publicClient: mainnetClient,
  ecsDomain: 'ecs.eth'
})

const result = await resolver.resolveWithDetails(
  'vitalik.eth',
  'eth.ecs.ethstars.stars'
)
```

**Note**: The examples use Alchemy demo RPC URLs for simplicity. For production use, provide your own RPC URL. The library doesn't load environment variables - that's your responsibility.
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
ecs-js/
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
