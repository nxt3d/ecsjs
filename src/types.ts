/**
 * ECS (Ethereum Credential Service) Types
 * 
 * This module defines all the TypeScript types and interfaces used throughout
 * the ECS resolver library.
 */

import type { PublicClient } from 'viem'

/**
 * Supported credential identifier types
 */
export type CredentialIdentifierType = 'name' | 'address'

/**
 * Supported coin types for address-based credentials
 * Using ENSIP-11 coin type values in lowercase hex
 * Accepts any valid hex string for maximum flexibility
 */
export type CoinType = string

/**
 * Configuration for the ECS resolver
 */
export interface ECSResolverConfig {
  /** Viem public client instance */
  publicClient: PublicClient
  /** Optional custom ECS domain (defaults to 'ecs.eth') */
  ecsDomain?: string
}

/**
 * Options for resolving credentials
 */
export interface ResolveCredentialOptions {
  /** Timeout in milliseconds for the resolution (default: 10000) */
  timeout?: number
  /** Whether to throw on resolution errors or return null (default: false) */
  throwOnError?: boolean
}

/**
 * Credential identifier for name-based resolution
 */
export interface NameCredentialIdentifier {
  type: 'name'
  /** The ENS name or DNS domain (e.g., 'vitalik.eth', 'ethereum.org') */
  name: string
}

/**
 * Credential identifier for address-based resolution
 */
export interface AddressCredentialIdentifier {
  type: 'address'
  /** The Ethereum address (with or without 0x prefix) */
  address: string
  /** The coin type in hex format (default: '3c' for Ethereum) */
  coinType?: CoinType
}

/**
 * Union type for all credential identifiers
 */
export type CredentialIdentifier = NameCredentialIdentifier | AddressCredentialIdentifier

/**
 * Result of a credential resolution
 */
export interface CredentialResolutionResult {
  /** The credential value, or null if not found */
  value: string | null
  /** The ENS name that was queried */
  ensName: string
  /** The credential key that was queried */
  credentialKey: string
  /** Whether the resolution was successful */
  success: boolean
  /** Error message if resolution failed */
  error?: string
}

/**
 * Batch resolution request
 */
export interface BatchCredentialRequest {
  /** The identifier for the credential */
  identifier: CredentialIdentifier
  /** The credential key to resolve */
  credentialKey: string
}

/**
 * Batch resolution result
 */
export interface BatchCredentialResult extends CredentialResolutionResult {
  /** The original request that generated this result */
  request: BatchCredentialRequest
}

/**
 * ECS namespace information
 */
export interface ECSNamespace {
  /** The namespace name (e.g., 'ethstars') */
  name: string
  /** The full domain (e.g., 'ethstars.ecs.eth') */
  domain: string
  /** Whether the namespace is active */
  active: boolean
}



/**
 * Error types that can occur during credential resolution
 */
export class ECSError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'ECSError'
  }
}

export class InvalidIdentifierError extends ECSError {
  constructor(message: string) {
    super(message, 'INVALID_IDENTIFIER')
  }
}

export class InvalidCredentialKeyError extends ECSError {
  constructor(message: string) {
    super(message, 'INVALID_CREDENTIAL_KEY')
  }
}

export class ResolutionTimeoutError extends ECSError {
  constructor(message: string) {
    super(message, 'RESOLUTION_TIMEOUT')
  }
}

export class ENSResolutionError extends ECSError {
  constructor(message: string) {
    super(message, 'ENS_RESOLUTION_ERROR')
  }
}
