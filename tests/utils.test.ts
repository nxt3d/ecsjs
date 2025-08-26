/**
 * Unit tests for ECS utility functions
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeAddress,
  normalizeName,
  constructENSName,
  validateCoinType,
  validateCredentialKey,
  createNameIdentifier,
  createAddressIdentifier,
  validateCredentialRequest
} from '../src/utils'
import { InvalidIdentifierError, InvalidCredentialKeyError } from '../src/types'

describe('normalizeAddress', () => {
  it('should normalize valid addresses', () => {
    expect(normalizeAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(
      'd8da6bf26964af9d7eed9e03e53415d37aa96045'
    )
    expect(normalizeAddress('D8DA6BF26964AF9D7EED9E03E53415D37AA96045')).toBe(
      'd8da6bf26964af9d7eed9e03e53415d37aa96045'
    )
    expect(normalizeAddress('d8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(
      'd8da6bf26964af9d7eed9e03e53415d37aa96045'
    )
  })

  it('should throw for invalid addresses', () => {
    expect(() => normalizeAddress('invalid')).toThrow(InvalidIdentifierError)
    expect(() => normalizeAddress('0x123')).toThrow(InvalidIdentifierError)
    expect(() => normalizeAddress('0xzzzz6bf26964af9d7eed9e03e53415d37aa96045')).toThrow(InvalidIdentifierError)
    expect(() => normalizeAddress('')).toThrow(InvalidIdentifierError)
  })
})

describe('normalizeName', () => {
  it('should normalize valid names', () => {
    expect(normalizeName('vitalik.eth')).toBe('vitalik.eth')
    expect(normalizeName('VITALIK.ETH')).toBe('vitalik.eth')
    expect(normalizeName('  ethereum.org  ')).toBe('ethereum.org')
    expect(normalizeName('sub.domain.com')).toBe('sub.domain.com')
  })

  it('should throw for invalid names', () => {
    expect(() => normalizeName('')).toThrow(InvalidIdentifierError)
    expect(() => normalizeName('   ')).toThrow(InvalidIdentifierError)
    expect(() => normalizeName('invalid name')).toThrow(InvalidIdentifierError)
    expect(() => normalizeName('invalid@name')).toThrow(InvalidIdentifierError)
  })
})

describe('validateCoinType', () => {
  it('should validate valid coin types', () => {
    expect(() => validateCoinType('3c')).not.toThrow()
    expect(() => validateCoinType('0')).not.toThrow()
    expect(() => validateCoinType('2')).not.toThrow()
    expect(() => validateCoinType('91')).not.toThrow()
  })

  it('should throw for invalid coin types', () => {
    expect(() => validateCoinType('invalid')).toThrow(InvalidIdentifierError)
    expect(() => validateCoinType('60')).toThrow(InvalidIdentifierError)
    expect(() => validateCoinType('3C')).toThrow(InvalidIdentifierError)
  })
})

describe('constructENSName', () => {
  it('should construct name-based ENS names', () => {
    const identifier = { type: 'name' as const, name: 'vitalik.eth' }
    expect(constructENSName(identifier)).toBe('vitalik.eth.name.ecs.eth')
    expect(constructENSName(identifier, 'custom.eth')).toBe('vitalik.eth.name.custom.eth')
  })

  it('should construct address-based ENS names', () => {
    const identifier = {
      type: 'address' as const,
      address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      coinType: '3c' as const
    }
    expect(constructENSName(identifier)).toBe(
      'd8da6bf26964af9d7eed9e03e53415d37aa96045.3c.addr.ecs.eth'
    )
  })

  it('should use default coin type for addresses', () => {
    const identifier = {
      type: 'address' as const,
      address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
    }
    expect(constructENSName(identifier)).toBe(
      'd8da6bf26964af9d7eed9e03e53415d37aa96045.3c.addr.ecs.eth'
    )
  })
})

describe('validateCredentialKey', () => {
  it('should validate valid credential keys', () => {
    expect(() => validateCredentialKey('eth.ecs.ethstars.stars')).not.toThrow()
    expect(() => validateCredentialKey('eth.ecs.namespace.sub.credential')).not.toThrow()
  })

  it('should throw for invalid credential keys', () => {
    expect(() => validateCredentialKey('')).toThrow(InvalidCredentialKeyError)
    expect(() => validateCredentialKey('invalid')).toThrow(InvalidCredentialKeyError)
    expect(() => validateCredentialKey('wrong.ecs.namespace.credential')).toThrow(InvalidCredentialKeyError)
    expect(() => validateCredentialKey('eth.wrong.namespace.credential')).toThrow(InvalidCredentialKeyError)
    expect(() => validateCredentialKey('eth.ecs')).toThrow(InvalidCredentialKeyError)
  })
})



describe('createNameIdentifier', () => {
  it('should create valid name identifiers', () => {
    const identifier = createNameIdentifier('vitalik.eth')
    expect(identifier).toEqual({
      type: 'name',
      name: 'vitalik.eth'
    })
  })

  it('should normalize names in identifiers', () => {
    const identifier = createNameIdentifier('  VITALIK.ETH  ')
    expect(identifier).toEqual({
      type: 'name',
      name: 'vitalik.eth'
    })
  })
})

describe('createAddressIdentifier', () => {
  it('should create valid address identifiers', () => {
    const identifier = createAddressIdentifier('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
    expect(identifier).toEqual({
      type: 'address',
      address: 'd8da6bf26964af9d7eed9e03e53415d37aa96045',
      coinType: '3c'
    })
  })

  it('should accept custom coin types', () => {
    const identifier = createAddressIdentifier(
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      '0'
    )
    expect(identifier).toEqual({
      type: 'address',
      address: 'd8da6bf26964af9d7eed9e03e53415d37aa96045',
      coinType: '0'
    })
  })
})

describe('validateCredentialRequest', () => {
  it('should validate valid requests', () => {
    const nameIdentifier = createNameIdentifier('vitalik.eth')
    const addressIdentifier = createAddressIdentifier('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
    
    expect(() => validateCredentialRequest(nameIdentifier, 'eth.ecs.ethstars.stars')).not.toThrow()
    expect(() => validateCredentialRequest(addressIdentifier, 'eth.ecs.ethstars.stars')).not.toThrow()
  })

  it('should throw for invalid requests', () => {
    const validIdentifier = createNameIdentifier('vitalik.eth')
    
    expect(() => validateCredentialRequest(validIdentifier, 'invalid.key')).toThrow()
  })
})
