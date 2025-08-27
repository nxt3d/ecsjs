/**
 * ecs.js Library
 * 
 * A TypeScript library for resolving ECS (Ethereum Credential Service) credentials using Viem.
 * 
 * @example Basic Usage
 * ```typescript
 * import { createECSResolver, createNameIdentifier } from '@nxt3d/ecsjs'
 * import { createPublicClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 * 
 * const publicClient = createPublicClient({
 *   chain: mainnet,
 *   transport: http()
 * })
 * 
 * const resolver = createECSResolver({ publicClient })
 * 
 * // Resolve a name-based credential
 * const result = await resolver.resolveNameCredential(
 *   'vitalik.eth',
 *   'eth.ecs.ethstars.stars'
 * )
 * 
 * console.log(result.value) // e.g., "12728"
 * ```
 */

// Export main resolver class and factory
export { ECSResolver } from './resolver'

// Export main resolver (unified API)
export { createECSResolver } from './ecs-resolver'
export type { ResolverConfig, Resolver } from './ecs-resolver'

// Export all types
export type {
  // Core types
  CredentialIdentifierType,
  CoinType,
  ECSResolverConfig,
  ResolveCredentialOptions,
  
  // Identifier types
  CredentialIdentifier,
  NameCredentialIdentifier,
  AddressCredentialIdentifier,
  
  // Result types
  CredentialResolutionResult,
  BatchCredentialRequest,
  BatchCredentialResult,
  
  // Metadata types
  ECSNamespace
} from './types'

// Export error classes
export {
  ECSError,
  InvalidIdentifierError,
  InvalidCredentialKeyError,
  ResolutionTimeoutError,
  ENSResolutionError
} from './types'

// Export utility functions
export {
  // Address and name utilities
  normalizeAddress,
  normalizeName,
  constructENSName,
  
  // Validation utilities
  validateCoinType,
  validateCredentialKey,
  validateCredentialRequest,
  

  
  // Factory functions
  createNameIdentifier,
  createAddressIdentifier,
  
  // Constants
  DEFAULT_COIN_TYPE,
  DEFAULT_ECS_DOMAIN
} from './utils'
