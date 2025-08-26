/**
 * ECS Utility Functions
 * 
 * This module provides utility functions for formatting addresses, constructing ENS names,
 * and validating inputs for ECS credential resolution.
 */

import type { 
  CredentialIdentifier, 
  CoinType, 
  CredentialMetadata,
  NameCredentialIdentifier,
  AddressCredentialIdentifier 
} from './types'
import { 
  InvalidIdentifierError, 
  InvalidCredentialKeyError 
} from './types'

/**
 * Default coin type for Ethereum addresses (60 in decimal = 3c in hex)
 */
export const DEFAULT_COIN_TYPE: CoinType = '3c'

/**
 * Default ECS domain
 */
export const DEFAULT_ECS_DOMAIN = 'ecs.eth'

/**
 * Validates and normalizes an Ethereum address
 * @param address - The address to validate (with or without 0x prefix)
 * @returns The normalized lowercase address without 0x prefix
 * @throws InvalidIdentifierError if the address is invalid
 */
export function normalizeAddress(address: string): string {
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address
  
  // Validate hex format and length
  if (!/^[0-9a-fA-F]{40}$/.test(cleanAddress)) {
    throw new InvalidIdentifierError(`Invalid Ethereum address format: ${address}`)
  }
  
  return cleanAddress.toLowerCase()
}

/**
 * Validates a coin type
 * @param coinType - The coin type to validate
 * @throws InvalidIdentifierError if the coin type is invalid
 */
export function validateCoinType(coinType: string): asserts coinType is CoinType {
  const validCoinTypes: CoinType[] = ['3c', '0', '2', '91']
  if (!validCoinTypes.includes(coinType as CoinType)) {
    throw new InvalidIdentifierError(`Invalid coin type: ${coinType}. Supported types: ${validCoinTypes.join(', ')}`)
  }
}

/**
 * Validates and normalizes a domain name or ENS name
 * @param name - The name to validate
 * @returns The normalized name
 * @throws InvalidIdentifierError if the name is invalid
 */
export function normalizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new InvalidIdentifierError('Name must be a non-empty string')
  }
  
  const trimmedName = name.trim().toLowerCase()
  
  if (trimmedName.length === 0) {
    throw new InvalidIdentifierError('Name cannot be empty')
  }
  
  // Basic validation - should not contain spaces or special characters except dots and hyphens
  if (!/^[a-z0-9.-]+$/.test(trimmedName)) {
    throw new InvalidIdentifierError(`Invalid name format: ${name}. Names can only contain letters, numbers, dots, and hyphens`)
  }
  
  return trimmedName
}

/**
 * Constructs an ENS name for credential resolution
 * @param identifier - The credential identifier
 * @param ecsDomain - The ECS domain (default: 'ecs.eth')
 * @returns The constructed ENS name
 */
export function constructENSName(
  identifier: CredentialIdentifier, 
  ecsDomain: string = DEFAULT_ECS_DOMAIN
): string {
  if (identifier.type === 'name') {
    const normalizedName = normalizeName(identifier.name)
    return `${normalizedName}.name.${ecsDomain}`
  } else if (identifier.type === 'address') {
    const normalizedAddress = normalizeAddress(identifier.address)
    const coinType = identifier.coinType || DEFAULT_COIN_TYPE
    validateCoinType(coinType)
    return `${normalizedAddress}.${coinType}.addr.${ecsDomain}`
  } else {
    throw new InvalidIdentifierError(`Unsupported identifier type: ${(identifier as any).type}`)
  }
}

/**
 * Validates a credential key format
 * @param credentialKey - The credential key to validate (e.g., 'eth.ecs.ethstars.stars')
 * @throws InvalidCredentialKeyError if the key is invalid
 */
export function validateCredentialKey(credentialKey: string): void {
  if (!credentialKey || typeof credentialKey !== 'string') {
    throw new InvalidCredentialKeyError('Credential key must be a non-empty string')
  }
  
  const trimmedKey = credentialKey.trim()
  
  if (trimmedKey.length === 0) {
    throw new InvalidCredentialKeyError('Credential key cannot be empty')
  }
  
  // Should follow the pattern: eth.ecs.namespace.credential
  const parts = trimmedKey.split('.')
  
  if (parts.length < 4) {
    throw new InvalidCredentialKeyError(
      `Invalid credential key format: ${credentialKey}. Expected format: eth.ecs.namespace.credential`
    )
  }
  
  if (parts[0] !== 'eth' || parts[1] !== 'ecs') {
    throw new InvalidCredentialKeyError(
      `Invalid credential key format: ${credentialKey}. Must start with 'eth.ecs'`
    )
  }
}

/**
 * Parses a credential key into its components
 * @param credentialKey - The credential key to parse
 * @returns The parsed credential metadata
 */
export function parseCredentialKey(credentialKey: string): CredentialMetadata {
  validateCredentialKey(credentialKey)
  
  const parts = credentialKey.split('.')
  
  // Format: eth.ecs.namespace.credential (or eth.ecs.namespace.sub.credential)
  // We take everything after 'eth.ecs' and before the last part as namespace
  // The last part is the credential name
  
  const namespaceParts = parts.slice(2, -1)
  const namespace = namespaceParts.join('.')
  const name = parts[parts.length - 1]!
  
  return {
    key: credentialKey,
    namespace,
    name
  }
}

/**
 * Creates a name-based credential identifier
 * @param name - The ENS name or DNS domain
 * @returns The credential identifier
 */
export function createNameIdentifier(name: string): NameCredentialIdentifier {
  return {
    type: 'name',
    name: normalizeName(name)
  }
}

/**
 * Creates an address-based credential identifier
 * @param address - The Ethereum address
 * @param coinType - The coin type (optional, defaults to Ethereum)
 * @returns The credential identifier
 */
export function createAddressIdentifier(
  address: string, 
  coinType: CoinType = DEFAULT_COIN_TYPE
): AddressCredentialIdentifier {
  validateCoinType(coinType)
  return {
    type: 'address',
    address: normalizeAddress(address),
    coinType
  }
}

/**
 * Validates a complete credential resolution request
 * @param identifier - The credential identifier
 * @param credentialKey - The credential key
 */
export function validateCredentialRequest(
  identifier: CredentialIdentifier,
  credentialKey: string
): void {
  // Validate credential key
  validateCredentialKey(credentialKey)
  
  // Validate identifier based on type
  if (identifier.type === 'name') {
    normalizeName(identifier.name)
  } else if (identifier.type === 'address') {
    normalizeAddress(identifier.address)
    if (identifier.coinType) {
      validateCoinType(identifier.coinType)
    }
  } else {
    throw new InvalidIdentifierError(`Unsupported identifier type: ${(identifier as any).type}`)
  }
}
