# ecsjs - Ethereum Credential Service V2

[![npm version](https://img.shields.io/npm/v/@nxt3d/ecsjs.svg)](https://www.npmjs.com/package/@nxt3d/ecsjs)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Version:** 0.2.0-beta  
**Status:** Beta - Deployed on Sepolia

A JavaScript library for interacting with **ECS V2** (Ethereum Credential Service), a decentralized registry for known credential resolvers. ECS V2 is fully compatible with the [ENS Hooks standard](https://github.com/nxt3d/ensips/blob/hooks/ensips/hooks.md), enabling ENS names to securely resolve credentials from trusted resolvers.

## What is ECS V2?

**ECS V2** is a simplified, decentralized registry that maps labels (e.g., `name-stars`) to standard ENS resolvers. These resolvers serve verifiable credential data, either onchain or offchain (via CCIP-Read).

### Key Features

- 🎯 **Simple Registry**: Flat, single-label registry - no complex hierarchies
- 🔗 **ENS Hooks Compatible**: Designed for the ENS Hooks standard
- 🛡️ **Resolver Trust**: Track resolver age and enforce security policies
- 📦 **Standard Resolvers**: Uses standard ENSIP-10 Extended Resolvers
- 🌐 **Flexible Data**: Providers define their own schemas and keys
- ⚡ **Built on Viem**: Modern, type-safe Ethereum interactions

## Installation

```bash
npm install @nxt3d/ecsjs
```

> **Important:** This is version 0.2.0-beta of ECS V2. ECS V1 (0.1.x) is deprecated and incompatible.  
> **Note:** Viem is included as a dependency, no need to install separately.

## Quick Start

```typescript
import { createECSClient, sepolia, getResolverInfo, resolveCredential } from '@nxt3d/ecsjs'

// Create a client
const client = createECSClient({
  chain: sepolia,
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY'
})

// Resolve a credential from a known resolver
const resolverAddress = '0xB5D67A9bEf2052cC600f391A3997D46854cabC22'
const credential = await resolveCredential(
  client,
  resolverAddress,
  'eth.ecs.name-stars.starts:vitalik.eth'
)
console.log(credential) // "100"

// Get resolver information (for security checks)
const { label, resolverUpdated } = await getResolverInfo(client, resolverAddress)
console.log(label) // "name-stars"
console.log(resolverUpdated) // 1764948384n
```

## Architecture

### How ECS V2 Works

1. **Registry**: The `ECSRegistry` contract maintains a mapping of labels to resolver addresses
2. **ENS Integration**: Each label automatically gets a subdomain (e.g., `name-stars.ecs.eth`)
3. **Standard Resolvers**: Resolvers implement standard ENS interfaces (`text`, `addr`, etc.)
4. **One-to-One Mapping**: Each label maps to exactly one resolver (can be updated by owner)
5. **Hooks Integration**: ENS names use Hooks to reference ECS resolvers

### Usage Flow with Hooks

1. **User** sets a text record on their ENS name (e.g., `maria.eth`) containing a **Hook**:
   ```
   hook("text(bytes32,string)", 0xB5D67A9bEf2052cC600f391A3997D46854cabC22)
   ```

2. **Client** reads this record and extracts the resolver address

3. **Client** calls `getResolverInfo(resolverAddress)` to:
   - Find its registered label (e.g., `name-stars`)
   - Check the `resolverUpdated` timestamp
   - Make a trust decision based on resolver age

4. **Client** constructs the service name `name-stars.ecs.eth` (optional, for provenance)

5. **Client** queries the resolver directly for credentials

6. **Resolver** returns the verified credential data

This creates a trusted link where `maria.eth` doesn't store the credential herself; instead, it's resolved against a "known" trusted resolver.

## API Reference

### `createECSClient(config)`

Creates a Viem public client configured for ECS.

```typescript
import { createECSClient, sepolia } from '@nxt3d/ecsjs'

const client = createECSClient({
  chain: sepolia,
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY'
})
```

**Parameters:**
- `config.chain`: Chain to connect to (`sepolia` or `mainnet`)
- `config.rpcUrl`: RPC URL for the chain

**Returns:** Viem `PublicClient`

### `getResolverInfo(client, resolverAddress)`

Get information about a resolver from its address.

```typescript
const { label, resolverUpdated } = await getResolverInfo(
  client,
  '0xB5D67A9bEf2052cC600f391A3997D46854cabC22'
)
```

**Parameters:**
- `client`: Viem public client
- `resolverAddress`: The resolver address

**Returns:** `Promise<{ label: string, resolverUpdated: bigint }>`

### `resolveCredential(client, resolverAddress, credentialKey)`

Resolve a credential from a known resolver.

```typescript
const credential = await resolveCredential(
  client,
  '0xB5D67A9bEf2052cC600f391A3997D46854cabC22',
  'eth.ecs.name-stars.starts:vitalik.eth'
)
```

**Parameters:**
- `client`: Viem public client
- `resolverAddress`: The resolver address
- `credentialKey`: The credential key to resolve

**Returns:** `Promise<string | null>`

### `getRegistryAddress(chainId)`

Get the ECS Registry address for a given chain.

```typescript
import { getRegistryAddress } from '@nxt3d/ecsjs'

const registryAddress = getRegistryAddress(11155111) // Sepolia
// Returns: "0x2bA1277bD3f5638F605696cb974eD67Ef81767Ec"
```

### `getResolverAge(resolverUpdated)`

Calculate the age of a resolver in seconds (helper for security checks).

```typescript
import { getResolverAge } from '@nxt3d/ecsjs'

const { resolverUpdated } = await getResolverInfo(client, resolverAddress)
const age = getResolverAge(resolverUpdated)
const ageInDays = Math.floor(age / 86400)
console.log(`Resolver is ${ageInDays} days old`)
```

## Resolver Trust and Security

**ECS V2 enforces a one-to-one relationship between labels and resolvers.** While owners can update resolvers (for upgrades), recent changes may indicate security concerns.

### Checking Resolver Age

```typescript
const { label, resolverUpdated } = await getResolverInfo(client, resolverAddress)
const resolverAge = getResolverAge(resolverUpdated)
const ageInDays = Math.floor(resolverAge / 86400)

// Enforce 90-day minimum age for high-security applications
if (ageInDays < 90) {
  console.warn(`⚠️ Resolver for "${label}" changed ${ageInDays} days ago`)
  // Reject or require security review
}
```

**Security-conscious clients can require resolvers to be established (e.g., 90+ days old) before trusting them.** Recent resolver changes may indicate:
- Compromise
- Untested deployments
- Migrations requiring review

## Deployments

### Sepolia Testnet

**Version:** 0.2.0-beta  
**Date:** December 5, 2025  
**Network:** Sepolia (Chain ID: 11155111)  
**Status:** ✅ Live and operational

#### Deployed Contracts

| Contract | Address | Verified |
|----------|---------|----------|
| ECS Registry | `0x2bA1277bD3f5638F605696cb974eD67Ef81767Ec` | [✅ View](https://sepolia.etherscan.io/address/0x2bA1277bD3f5638F605696cb974eD67Ef81767Ec) |
| ECS Registrar | `0x47C680d3720dDc23250cF697466582829a0533Ce` | [✅ View](https://sepolia.etherscan.io/address/0x47C680d3720dDc23250cF697466582829a0533Ce) |
| Credential Resolver (name-stars) | `0xB5D67A9bEf2052cC600f391A3997D46854cabC22` | [✅ View](https://sepolia.etherscan.io/address/0xB5D67A9bEf2052cC600f391A3997D46854cabC22) |

#### Configuration

- **Root Name:** `ecs.eth`
- **Root Node:** `0xe436ba58406c69a63a9611a11eb52314c5c17ba9eaaa7dab8506fe8849517286`
- **Deployer:** `0xF8e03bd4436371E0e2F7C02E529b2172fe72b4EF`
- **Registrar Pricing:** ~0.001 ETH/year (32000 wei/second)
- **Min Commitment Age:** 60 seconds

#### Registered Labels

##### name-stars.ecs.eth

- **Status:** ✅ Registered
- **Owner:** `0xF8e03bd4436371E0e2F7C02E529b2172fe72b4EF`
- **Resolver:** `0xB5D67A9bEf2052cC600f391A3997D46854cabC22`
- **Expires:** December 5, 2026

**Credential Records:**
- **Key:** `eth.ecs.name-stars.starts:vitalik.eth`
- **Value:** `"100"`

## Examples

### Basic Credential Resolution

```typescript
import { createECSClient, sepolia, resolveCredential } from '@nxt3d/ecsjs'

const client = createECSClient({
  chain: sepolia,
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY'
})

// Resolve credential directly
const credential = await resolveCredential(
  client,
  '0xB5D67A9bEf2052cC600f391A3997D46854cabC22',
  'eth.ecs.name-stars.starts:vitalik.eth'
)

console.log(`vitalik.eth has ${credential} stars`)
```

### With Security Checks

```typescript
import { 
  createECSClient, 
  sepolia, 
  getResolverInfo,
  getResolverAge,
  resolveCredential 
} from '@nxt3d/ecsjs'

const client = createECSClient({
  chain: sepolia,
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY'
})

const resolverAddress = '0xB5D67A9bEf2052cC600f391A3997D46854cabC22'

// Check resolver info first
const { label, resolverUpdated } = await getResolverInfo(client, resolverAddress)
const ageInDays = Math.floor(getResolverAge(resolverUpdated) / 86400)

console.log(`Resolver: ${label}.ecs.eth`)
console.log(`Age: ${ageInDays} days`)

// Enforce security policy
if (ageInDays < 90) {
  throw new Error(`Resolver too new: ${ageInDays} days (require 90+)`)
}

// Proceed with resolution
const credential = await resolveCredential(
  client,
  resolverAddress,
  'eth.ecs.name-stars.starts:vitalik.eth'
)

console.log(`Credential: ${credential}`)
```

### Using Viem Directly

Since ECS V2 uses standard ENS resolvers, you can also use Viem's ENS functions directly:

```typescript
import { createECSClient, sepolia, getResolverInfo } from '@nxt3d/ecsjs'

const client = createECSClient({
  chain: sepolia,
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY'
})

// Get the label from resolver address
const { label } = await getResolverInfo(
  client,
  '0xB5D67A9bEf2052cC600f391A3997D46854cabC22'
)

// Use Viem's getEnsText directly
const ensName = `${label}.ecs.eth`
const textValue = await client.getEnsText({
  name: ensName,
  key: 'eth.ecs.name-stars.starts:vitalik.eth'
})

console.log(textValue) // "100"
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Migration from V1

ECS V2 is a complete rewrite with a different architecture. Key differences:

### V1 (0.1.x) - Deprecated
- Complex multi-level registry (name.coinType.addr.ecs.eth)
- Custom credential resolution
- Multi-currency support via coinType
- Credential-first design

### V2 (0.2.0-beta) - Current
- Simple flat registry (label.ecs.eth)
- Standard ENS resolvers
- ENS Hooks integration
- Resolver-first design with trust tracking

**Migration is not automatic.** V2 requires new resolver deployments and a different integration approach. If you're using V1, please reach out for migration guidance.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [ECS V2 Protocol Repository](https://github.com/nxt3d/ecs)
- [ENS Hooks Standard](https://github.com/nxt3d/ensips/blob/hooks/ensips/hooks.md)
- [Viem Documentation](https://viem.sh/)
- [ENS Documentation](https://docs.ens.domains/)

---

**Note**: ECS V2 is currently in beta on Ethereum Sepolia testnet. The library has been tested with real deployments and works correctly. Use at your own risk in production environments.
