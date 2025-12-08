/**
 * ecsjs - Ethereum Credential Service JavaScript Library
 * Version 0.2.4-beta - ECS V2
 * 
 * A simple library for interacting with ECS V2, a decentralized registry
 * for known credential resolvers compatible with ENS Hooks.
 */

import type { PublicClient } from 'viem'
import { createPublicClient, http } from 'viem'
import type { Chain } from 'viem/chains'
import { mainnet, sepolia } from 'viem/chains'

// Re-export viem utilities
export { http, mainnet, sepolia }
export type { Chain, PublicClient }

// Known ECS Registry addresses by chain
const ECS_REGISTRY_ADDRESSES: Record<number, `0x${string}`> = {
  1: '0x0000000000000000000000000000000000000000', // Mainnet (not deployed yet)
  11155111: '0xb09C149664773bFA88B72FA41437AdADcB8bF5B4' // Sepolia (Dec 7, 2025 - deployment 01 - Resolver Review System)
}

/**
 * Configuration for creating an ECS client
 */
export interface ECSClientConfig {
  /** Chain to connect to (e.g., sepolia, mainnet) */
  chain: Chain
  /** RPC URL for the chain */
  rpcUrl: string
}

/**
 * Resolver information from the ECS Registry
 */
export interface ResolverInfo {
  /** The label (e.g., "name-stars") */
  label: string
  /** Timestamp when the resolver was last updated */
  resolverUpdated: bigint
  /** Admin-assigned review status or certification (e.g., "verified", "audited") */
  review: string
}

/**
 * Create a client for interacting with ECS
 * @param config - Client configuration
 * @returns Viem public client
 * 
 * @example
 * ```typescript
 * import { createECSClient, sepolia } from '@nxt3d/ecsjs'
 * 
 * const client = createECSClient({
 *   chain: sepolia,
 *   rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY'
 * })
 * ```
 */
export function createECSClient({ chain, rpcUrl }: ECSClientConfig): PublicClient {
  return createPublicClient({
    chain,
    transport: http(rpcUrl)
  })
}

// ECS Registry ABI - minimal interface
const ECS_REGISTRY_ABI = [
  {
    name: 'getResolverInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'resolver_', type: 'address' }],
    outputs: [
      { name: 'label', type: 'string' },
      { name: 'resolverUpdated', type: 'uint128' },
      { name: 'review', type: 'string' }
    ]
  }
] as const

/**
 * Get the resolver info associated with a resolver address
 * 
 * This is used when following ENS Hooks to identify which ECS service
 * a resolver belongs to and when it was last updated.
 * 
 * @param client - Viem public client
 * @param resolverAddress - The resolver address
 * @returns The resolver info { label, resolverUpdated, review }
 * @throws Error if ECS Registry is not deployed on the chain
 * 
 * @example
 * ```typescript
 * const { label, resolverUpdated, review } = await getResolverInfo(
 *   client,
 *   '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa'
 * )
 * // Returns: { label: "name-stars", resolverUpdated: 1764948384n, review: "" }
 * 
 * // Check resolver age for security
 * const resolverAge = Math.floor(Date.now() / 1000) - Number(resolverUpdated)
 * if (resolverAge < 90 * 24 * 60 * 60) {
 *   console.warn('Resolver changed recently')
 * }
 * 
 * // Check admin review status
 * if (review && review !== "verified") {
 *   console.warn(`Resolver review status: ${review}`)
 * }
 * ```
 */
export async function getResolverInfo(
  client: PublicClient,
  resolverAddress: `0x${string}`
): Promise<ResolverInfo> {
  const chainId = client.chain?.id
  
  if (!chainId) {
    throw new Error('Client chain ID not available')
  }
  
  const registryAddress = ECS_REGISTRY_ADDRESSES[chainId]
  
  if (!registryAddress || registryAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error(`ECS Registry not deployed on chain ${chainId}`)
  }
  
  const [label, resolverUpdated, review] = await client.readContract({
    address: registryAddress,
    abi: ECS_REGISTRY_ABI,
    functionName: 'getResolverInfo',
    args: [resolverAddress]
  })
  
  return { label, resolverUpdated, review }
}

/**
 * Resolve a credential from a resolver address
 * 
 * This function combines getResolverInfo with ENS text record resolution
 * to fetch credentials from known ECS resolvers.
 * 
 * @param client - Viem public client
 * @param resolverAddress - The resolver address
 * @param credentialKey - The credential key (e.g., "eth.ecs.name-stars.starts:vitalik.eth")
 * @returns The credential value
 * @throws Error if ECS Registry is not deployed or resolver not found
 * 
 * @example
 * ```typescript
 * const credential = await resolveCredential(
 *   client,
 *   '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa',
 *   'eth.ecs.name-stars.starts:vitalik.eth'
 * )
 * // Returns: "100"
 * ```
 */
export async function resolveCredential(
  client: PublicClient,
  resolverAddress: `0x${string}`,
  credentialKey: string
): Promise<string | null> {
  // Get the label for this resolver
  const { label } = await getResolverInfo(client, resolverAddress)
  
  // Construct the ENS name
  const ensName = `${label}.ecs.eth`
  
  // Resolve the credential using ENS
  const value = await client.getEnsText({
    name: ensName,
    key: credentialKey
  })
  
  return value
}

/**
 * Get the ECS Registry address for a given chain
 * @param chainId - The chain ID
 * @returns The registry address or zero address if not deployed
 * 
 * @example
 * ```typescript
 * const registryAddress = getRegistryAddress(11155111) // Sepolia
 * // Returns: "0x4f2F0e7b61d9Bd0e30F186D6530Efc92429Fcc77"
 * ```
 */
export function getRegistryAddress(chainId: number): `0x${string}` {
  return ECS_REGISTRY_ADDRESSES[chainId] || '0x0000000000000000000000000000000000000000'
}

/**
 * Calculate the age of a resolver in seconds
 * Helper function for security checks based on resolver freshness
 * 
 * @param resolverUpdated - The resolverUpdated timestamp from getResolverInfo
 * @returns Age in seconds
 * 
 * @example
 * ```typescript
 * const { resolverUpdated } = await getResolverInfo(client, resolverAddress)
 * const age = getResolverAge(resolverUpdated)
 * const ageInDays = Math.floor(age / 86400)
 * console.log(`Resolver is ${ageInDays} days old`)
 * ```
 */
export function getResolverAge(resolverUpdated: bigint): number {
  return Math.floor(Date.now() / 1000) - Number(resolverUpdated)
}
