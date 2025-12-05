# ecsjs - Ethereum Credential Service V2

[![npm version](https://img.shields.io/npm/v/@nxt3d/ecsjs.svg)](https://www.npmjs.com/package/@nxt3d/ecsjs)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Version:** 0.2.1-beta  
**Status:** Beta - Deployed on Sepolia

JavaScript/TypeScript library for interacting with **ECS V2** (Ethereum Credential Service), a decentralized registry for "known" credential resolvers. ECS V2 is fully compatible with the [ENS Hooks standard](https://github.com/nxt3d/ensips/blob/hooks/ensips/hooks.md), enabling ENS names to securely resolve credentials from trusted resolvers.

## Installation

```bash
npm install @nxt3d/ecsjs@0.2.1-beta
```

> **Version:** 0.2.1-beta - [View on NPM](https://www.npmjs.com/package/@nxt3d/ecsjs)  
> **Important:** ECS V1 is deprecated and incompatible with V2.  
> **Note:** This package includes viem as a dependency, so you don't need to install it separately.

## What is ECS V2?

**ECS V2** is a simplified, decentralized registry that maps labels (e.g., `name-stars`) to standard ENS resolvers. These resolvers serve verifiable credential data, either onchain or offchain (via CCIP-Read).

### Goals of V2

* **Simplicity:** The complex multi-level registry has been replaced with a flat, single-label registry. Labels (e.g., `name-stars`) map directly to resolvers.
* **Standard Resolvers:** Credential resolvers are now just standard [ENSIP-10 (Extended Resolver)](https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution) contracts. This means any existing ENS tooling can interact with them.
* **Flexible Data:** Credential providers can define their own schema and keys. There's no forced structure for credential data.
* **Hooks Integration:** ECS serves as the registry for [Hooks](https://github.com/nxt3d/ensips/blob/hooks/ensips/hooks.md). Hooks in ENS text records can reference ECS resolvers to fetch trusted data.
* **Resolver Trust:** The registry tracks `resolverUpdated` timestamps, allowing clients to enforce security policies based on resolver age.

## Usage Flow with Hooks

Hooks enable ENS names to redirect queries to known resolvers.

1. **User** sets a text record on their ENS name (e.g., `maria.eth`) containing a **Hook**:
   ```
   hook("text(bytes32,string)", 0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa)
   ```

2. **Client** reads this record and extracts the resolver address.

3. **Client** calls `getResolverInfo(resolverAddress)` on the ECS Registry to:
   - Find its registered label (e.g., `name-stars`)
   - Check the `resolverUpdated` timestamp to verify resolver stability
   - **Make a trust decision** based on how recently the resolver was changed

4. **Client** constructs the service name `name-stars.ecs.eth` (optional, for provenance).

5. **Client** queries the resolver directly: `text(node, "credential-key")`.
   - Note: Single-label resolvers ignore the `node` parameter, so any value (including `0x0`) works.

6. **Resolver** returns the verified credential data.

This creates a trusted link to the record, where `maria.eth` doesn't store the record herself; instead, the record can be resolved against a "known" trusted resolver.

## Quick Start

```typescript
import { 
  createECSClient, 
  sepolia,
  getResolverInfo, 
  resolveCredential 
} from '@nxt3d/ecsjs'

const client = createECSClient({
  chain: sepolia,
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY'
})

// User has hook pointing to resolver
const resolverAddress = '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa'
const credentialKey = 'eth.ecs.name-stars.starts:vitalik.eth'

// Get label and resolve credential in one call
const credential = await resolveCredential(client, resolverAddress, credentialKey)
// Returns: "100"

// Or get resolver info
const { label, resolverUpdated } = await getResolverInfo(client, resolverAddress)
// Returns: { label: "name-stars", resolverUpdated: 1764948384n }

// You can also use viem's ENS functions directly
const ensName = `${label}.ecs.eth`
const textValue = await client.getEnsText({
  name: ensName,
  key: credentialKey
})
// Returns: "100"
```

## Resolver Trust and Freshness

**ECS strictly enforces a one-to-one relationship between labels and resolvers.** While label owners can change resolvers (necessary for upgrades), this introduces a security concern. The registry tracks `resolverUpdated` timestamps, allowing clients to enforce security policies based on resolver age.

**Security-conscious clients can require resolvers to be established (e.g., 90+ days old) before trusting them.** Recent resolver changes may indicate compromise, untested deployments, or migrations requiring review.

```typescript
import { getResolverInfo, getResolverAge } from '@nxt3d/ecsjs'

const { label, resolverUpdated } = await getResolverInfo(client, resolverAddress)
const resolverAge = getResolverAge(resolverUpdated)
const ageInDays = Math.floor(resolverAge / 86400)

if (ageInDays < 90) { // 90 days for high security
  console.warn(`⚠️ Resolver for "${label}" changed ${ageInDays} days ago`)
  // Reject or require security review
}
```

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

---

### `getResolverInfo(client, resolverAddress)`

Get information about a resolver from its address.

```typescript
const { label, resolverUpdated } = await getResolverInfo(
  client,
  '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa'
)
```

**Parameters:**
- `client`: Viem public client
- `resolverAddress`: The resolver address

**Returns:** `Promise<{ label: string, resolverUpdated: bigint }>`

---

### `resolveCredential(client, resolverAddress, credentialKey)`

Resolve a credential from a known resolver.

```typescript
const credential = await resolveCredential(
  client,
  '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa',
  'eth.ecs.name-stars.starts:vitalik.eth'
)
```

**Parameters:**
- `client`: Viem public client
- `resolverAddress`: The resolver address
- `credentialKey`: The credential key to resolve

**Returns:** `Promise<string | null>`

---

### `getRegistryAddress(chainId)`

Get the ECS Registry address for a given chain.

```typescript
import { getRegistryAddress } from '@nxt3d/ecsjs'

const registryAddress = getRegistryAddress(11155111) // Sepolia
// Returns: "0x4f2F0e7b61d9Bd0e30F186D6530Efc92429Fcc77"
```

**Parameters:**
- `chainId`: The chain ID (e.g., `11155111` for Sepolia)

**Returns:** `string` - The registry address

---

### `getResolverAge(resolverUpdated)`

Calculate the age of a resolver in seconds (helper for security checks).

```typescript
import { getResolverAge } from '@nxt3d/ecsjs'

const { resolverUpdated } = await getResolverInfo(client, resolverAddress)
const ageInSeconds = getResolverAge(resolverUpdated)
const ageInDays = Math.floor(ageInSeconds / 86400)
console.log(`Resolver is ${ageInDays} days old`)
```

**Parameters:**
- `resolverUpdated`: The `resolverUpdated` timestamp (bigint)

**Returns:** `number` - Age in seconds

## Deployments

### Sepolia Testnet

**Version:** 0.2.1-beta  
**Date:** December 5, 2025  
**Network:** Sepolia (Chain ID: 11155111)  
**Status:** ✅ Live and operational (Deployment 03 - Minimal Clone Factory)

#### Deployed Contracts

| Contract | Address | Verified |
|----------|---------|----------|
| ECS Registry | `0x4f2F0e7b61d9Bd0e30F186D6530Efc92429Fcc77` | [✅ View](https://sepolia.etherscan.io/address/0x4f2F0e7b61d9Bd0e30F186D6530Efc92429Fcc77) |
| ECS Registrar | `0x3f971176d86f223bB8A664F7ce006B818d1D5649` | [✅ View](https://sepolia.etherscan.io/address/0x3f971176d86f223bB8A664F7ce006B818d1D5649) |
| Credential Resolver (Implementation) | `0x04c55c4CCAf0b7bb2e00bc3ea72a92585FE35683` | [✅ View](https://sepolia.etherscan.io/address/0x04c55c4CCAf0b7bb2e00bc3ea72a92585FE35683) |
| Credential Resolver Factory | `0x3d9BFC750F1eb7EDaDA2DB0e5dE0F763c30446c1` | [✅ View](https://sepolia.etherscan.io/address/0x3d9bfc750f1eb7edada2db0e5de0f763c30446c1) |
| Credential Resolver (Clone - name-stars) | `0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa` | [View](https://sepolia.etherscan.io/address/0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa) |

> **New:** Resolver deployments now use EIP-1167 minimal clones, providing **91% gas savings** (1.98M gas → 169K gas per resolver)

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
- **Resolver:** `0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa` (minimal clone)
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
  '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa',
  'eth.ecs.name-stars.starts:vitalik.eth'
)

console.log(`vitalik.eth has ${credential} stars`) // "vitalik.eth has 100 stars"
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

const resolverAddress = '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa'

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
  '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa'
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
npm test               # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Migration from V1

ECS V2 is a complete rewrite with a different architecture. Key differences:

### V1 (0.1.x) - Deprecated
- Complex multi-level registry (`name.coinType.addr.ecs.eth`)
- Custom credential resolution
- Multi-currency support via coinType
- Credential-first design

### V2 (0.2.1-beta) - Current
- Simple flat registry (`label.ecs.eth`)
- Standard ENS resolvers (ENSIP-10)
- ENS Hooks integration
- Resolver-first design with trust tracking

**Migration is not automatic.** V2 requires new resolver deployments and a different integration approach. If you're using V1, please reach out for migration guidance.

## TypeScript Support

This library is written in TypeScript and includes full type definitions. All functions are fully typed for the best developer experience.

```typescript
import type { PublicClient, Chain } from '@nxt3d/ecsjs'
```

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
