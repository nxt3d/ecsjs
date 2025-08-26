/**
 * ECS Resolver - Core Library
 * 
 * This module provides the main ECSResolver class that wraps Viem functionality
 * for resolving ECS (Ethereum Credential Service) credentials.
 */

import { normalize } from 'viem/ens'
import type { 
  ECSResolverConfig,
  CredentialIdentifier,
  ResolveCredentialOptions,
  CredentialResolutionResult,
  BatchCredentialRequest,
  BatchCredentialResult
} from './types'
import {
  ENSResolutionError,
  ResolutionTimeoutError
} from './types'
import {
  constructENSName,
  validateCredentialRequest,
  DEFAULT_ECS_DOMAIN
} from './utils'

/**
 * Main ECS Resolver class that provides methods for resolving credentials
 */
export class ECSResolver {
  private readonly publicClient
  private readonly ecsDomain: string

  /**
   * Creates a new ECS resolver instance
   * @param config - Configuration options
   */
  constructor(config: ECSResolverConfig) {
    this.publicClient = config.publicClient
    this.ecsDomain = config.ecsDomain || DEFAULT_ECS_DOMAIN
  }

  /**
   * Resolves a single credential for the given identifier
   * @param identifier - The credential identifier (name or address-based)
   * @param credentialKey - The credential key to resolve (e.g., 'eth.ecs.ethstars.stars')
   * @param options - Resolution options
   * @returns Promise resolving to the credential resolution result
   */
  async resolveCredential(
    identifier: CredentialIdentifier,
    credentialKey: string,
    options: ResolveCredentialOptions = {}
  ): Promise<CredentialResolutionResult> {
    const { timeout = 10000, throwOnError = false } = options

    try {
      // Validate the request
      validateCredentialRequest(identifier, credentialKey)

      // Construct the ENS name
      const ensName = constructENSName(identifier, this.ecsDomain)

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new ResolutionTimeoutError(`Credential resolution timed out after ${timeout}ms`))
        }, timeout)
      })

      // Resolve the credential with timeout
      const resolutionPromise = this._resolveCredentialInternal(ensName, credentialKey)
      
      const value = await Promise.race([resolutionPromise, timeoutPromise])

      return {
        value: value,
        ensName,
        credentialKey,
        success: value !== null
      }
    } catch (error) {
      const result: CredentialResolutionResult = {
        value: null,
        ensName: constructENSName(identifier, this.ecsDomain),
        credentialKey,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      if (throwOnError) {
        throw error
      }

      return result
    }
  }

  /**
   * Resolves multiple credentials in batch
   * @param requests - Array of credential requests
   * @param options - Resolution options
   * @returns Promise resolving to array of credential resolution results
   */
  async resolveCredentialsBatch(
    requests: BatchCredentialRequest[],
    options: ResolveCredentialOptions = {}
  ): Promise<BatchCredentialResult[]> {
    const promises = requests.map(async (request): Promise<BatchCredentialResult> => {
      const result = await this.resolveCredential(
        request.identifier,
        request.credentialKey,
        options
      )
      return {
        ...result,
        request
      }
    })

    return Promise.all(promises)
  }

  /**
   * Resolves a credential for a name-based identifier
   * @param name - The ENS name or DNS domain
   * @param credentialKey - The credential key to resolve
   * @param options - Resolution options
   * @returns Promise resolving to the credential resolution result
   */
  async resolveNameCredential(
    name: string,
    credentialKey: string,
    options: ResolveCredentialOptions = {}
  ): Promise<CredentialResolutionResult> {
    return this.resolveCredential(
      { type: 'name', name },
      credentialKey,
      options
    )
  }

  /**
   * Resolves a credential for an address-based identifier
   * @param address - The Ethereum address
   * @param credentialKey - The credential key to resolve
   * @param coinType - The coin type (optional, defaults to Ethereum)
   * @param options - Resolution options
   * @returns Promise resolving to the credential resolution result
   */
  async resolveAddressCredential(
    address: string,
    credentialKey: string,
    coinType: string = '3c',
    options: ResolveCredentialOptions = {}
  ): Promise<CredentialResolutionResult> {
    return this.resolveCredential(
      { type: 'address', address, coinType: coinType as any },
      credentialKey,
      options
    )
  }



  /**
   * Constructs the ENS name that would be used for resolution
   * @param identifier - The credential identifier
   * @returns The ENS name that would be queried
   */
  getENSName(identifier: CredentialIdentifier): string {
    return constructENSName(identifier, this.ecsDomain)
  }

  /**
   * Internal method to resolve a credential using Viem
   * @private
   */
  private async _resolveCredentialInternal(
    ensName: string,
    credentialKey: string
  ): Promise<string | null> {
    try {
      // Normalize the ENS name
      const normalizedName = normalize(ensName)

      // Get the text record using Viem
      const textRecord = await this.publicClient.getEnsText({
        name: normalizedName,
        key: credentialKey
      })

      // Return the text record value, or null if empty  
      if (!textRecord) {
        return null
      }

      // Convert to string and trim, handling potential buffer/byte array issues
      let cleanValue: string
      
      if (typeof textRecord === 'string') {
        // Clean up control characters and null bytes
        cleanValue = textRecord.replace(/[\x00-\x1F\x7F]/g, '').trim()
      } else if (textRecord && typeof textRecord === 'object') {
        // Handle case where viem returns a buffer or byte array
        try {
          const bufferValue = Buffer.from(textRecord as any).toString('utf8')
          // Clean up control characters and null bytes
          cleanValue = bufferValue.replace(/[\x00-\x1F\x7F]/g, '').trim()
        } catch {
          const stringValue = String(textRecord)
          // Clean up control characters and null bytes
          cleanValue = stringValue.replace(/[\x00-\x1F\x7F]/g, '').trim()
        }
      } else {
        const stringValue = String(textRecord)
        // Clean up control characters and null bytes
        cleanValue = stringValue.replace(/[\x00-\x1F\x7F]/g, '').trim()
      }
      
      if (cleanValue === '') {
        return null
      }
      
      // Check if the value is hex-encoded (starts with 0x)
      if (cleanValue.startsWith('0x')) {
        try {
          // Decode hex to string
          const bytes = cleanValue.slice(2) // Remove '0x' prefix
          const decoded = Buffer.from(bytes, 'hex').toString('utf8').trim()
          return decoded || null
        } catch (error) {
          // If hex decoding fails, return the original value
          return cleanValue
        }
      }
      
      return cleanValue
    } catch (error) {
      // Handle specific Viem errors
      if (error instanceof Error) {
        // Check for common ENS resolution errors
        if (error.message.includes('resolver not found') || 
            error.message.includes('name not found') ||
            error.message.includes('record not found')) {
          return null
        }
        
        // Re-throw as ENS resolution error
        throw new ENSResolutionError(`Failed to resolve ENS text record: ${error.message}`)
      }
      
      throw new ENSResolutionError('Unknown ENS resolution error')
    }
  }
}

/**
 * Creates a new ECS resolver instance
 * @param config - Configuration options
 * @returns A new ECS resolver instance
 */
export function createECSResolver(config: ECSResolverConfig): ECSResolver {
  return new ECSResolver(config)
}
