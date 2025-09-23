/**
 * ECS Resolver
 * 
 * Provides a unified API that adapts based on the configuration provided.
 * Can work in simple mode (just network) or advanced mode (custom viem client).
 */

import { createPublicClient, http, type PublicClient } from 'viem'
import { sepolia, mainnet } from 'viem/chains'
import { createECSResolver as createBaseECSResolver } from './resolver'
import type { CredentialResolutionResult } from './types'

export interface ResolverConfig {
  // Simple mode
  network?: 'sepolia' | 'mainnet'
  rpcUrl?: string
  
  // Advanced mode
  publicClient?: PublicClient
  ecsDomain?: string
}

export interface Resolver {
  // Simple methods (return string | null)
  resolve(name: string, credential: string): Promise<string | null>
  resolveAddress(address: string, credential: string, coinType?: string): Promise<string | null>
  
  // Advanced methods (return full result objects)
  resolveWithDetails(name: string, credential: string): Promise<CredentialResolutionResult>
  resolveAddressWithDetails(address: string, credential: string, coinType?: string): Promise<CredentialResolutionResult>
  
  // Batch operations
  resolveBatch(requests: Array<{ name: string; credential: string }>): Promise<Array<string | null>>
  resolveAddressBatch(requests: Array<{ address: string; credential: string; coinType?: string }>): Promise<Array<string | null>>
  
  // Utility methods
  getENSName(identifier: { type: 'name'; name: string } | { type: 'address'; address: string; coinType?: string }): string
}

/**
 * Creates an ECS resolver that adapts based on configuration
 * @param config - Configuration options
 * @returns ECS resolver instance
 */
export function createECSResolver(config: ResolverConfig): Resolver {
  let resolver: any
  
  if (config.publicClient) {
    // Advanced mode: use provided viem client
    resolver = createBaseECSResolver({ 
      publicClient: config.publicClient,
      ...(config.ecsDomain && { ecsDomain: config.ecsDomain })
    })
  } else if (config.network) {
    // Simple mode: create viem client automatically
    const chain = config.network === 'sepolia' ? sepolia : mainnet
    const rpcUrl = config.rpcUrl || getDefaultRpcUrl(config.network)
    
    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })
    
    resolver = createBaseECSResolver({ 
      publicClient,
      ...(config.ecsDomain && { ecsDomain: config.ecsDomain })
    })
  } else {
    throw new Error('Must provide either network or publicClient')
  }
  
  return {
    // Simple methods
    async resolve(name: string, credential: string): Promise<string | null> {
      const result = await resolver.resolveNameCredential(name, credential)
      return result.success ? result.value : null
    },
    
    async resolveAddress(address: string, credential: string, coinType?: string): Promise<string | null> {
      const result = await resolver.resolveAddressCredential(address, credential, coinType)
      return result.success ? result.value : null
    },
    
    // Advanced methods
    async resolveWithDetails(name: string, credential: string): Promise<CredentialResolutionResult> {
      return await resolver.resolveNameCredential(name, credential)
    },
    
    async resolveAddressWithDetails(address: string, credential: string, coinType?: string): Promise<CredentialResolutionResult> {
      return await resolver.resolveAddressCredential(address, credential, coinType)
    },
    
    // Batch methods
    async resolveBatch(requests: Array<{ name: string; credential: string }>): Promise<Array<string | null>> {
      const batchRequests = requests.map(req => ({
        identifier: { type: 'name' as const, name: req.name },
        credentialKey: req.credential
      }))
      
      const results = await resolver.resolveCredentialsBatch(batchRequests)
      return results.map((result: any) => result.success ? result.value : null)
    },
    
    async resolveAddressBatch(requests: Array<{ address: string; credential: string; coinType?: string }>): Promise<Array<string | null>> {
      const batchRequests = requests.map(req => ({
        identifier: { type: 'address' as const, address: req.address, coinType: req.coinType },
        credentialKey: req.credential
      }))
      
      const results = await resolver.resolveCredentialsBatch(batchRequests)
      return results.map((result: any) => result.success ? result.value : null)
    },
    
    // Utility methods
    getENSName(identifier: { type: 'name'; name: string } | { type: 'address'; address: string; coinType?: string }): string {
      if (identifier.type === 'name') {
        return resolver.getENSName({ type: 'name', name: identifier.name })
      } else {
        return resolver.getENSName({ 
          type: 'address', 
          address: identifier.address, 
          coinType: identifier.coinType as any 
        })
      }
    }
  }
}

/**
 * Gets the default RPC URL for the specified network
 * @param network - The network to get RPC URL for
 * @returns Default RPC URL
 */
function getDefaultRpcUrl(network: 'sepolia' | 'mainnet'): string {
  switch (network) {
    case 'sepolia':
      return 'https://eth-sepolia.g.alchemy.com/v2/demo'
    case 'mainnet':
      return 'https://eth-mainnet.g.alchemy.com/v2/demo'
    default:
      throw new Error(`Unsupported network: ${network}`)
  }
}
