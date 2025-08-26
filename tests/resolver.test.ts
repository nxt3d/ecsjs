/**
 * Unit tests for ECS resolver
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ECSResolver, createECSResolver } from '../src/resolver'
import type { PublicClient } from 'viem'

// Mock Viem's normalize function
vi.mock('viem/ens', () => ({
  normalize: vi.fn((name: string) => name.toLowerCase())
}))

describe('ECSResolver', () => {
  let mockPublicClient: PublicClient
  let resolver: ECSResolver

  beforeEach(() => {
    // Create a mock public client
    mockPublicClient = {
      getEnsText: vi.fn()
    } as any

    resolver = new ECSResolver({ publicClient: mockPublicClient })
  })

  describe('constructor', () => {
    it('should create resolver with default domain', () => {
      const resolver = new ECSResolver({ publicClient: mockPublicClient })
      expect(resolver).toBeInstanceOf(ECSResolver)
    })

    it('should create resolver with custom domain', () => {
      const resolver = new ECSResolver({
        publicClient: mockPublicClient,
        ecsDomain: 'custom.eth'
      })
      expect(resolver).toBeInstanceOf(ECSResolver)
    })
  })

  describe('resolveCredential', () => {
    it('should resolve name-based credentials successfully', async () => {
      const mockTextRecord = '12728'
      vi.mocked(mockPublicClient.getEnsText).mockResolvedValue(mockTextRecord)

      const result = await resolver.resolveCredential(
        { type: 'name', name: 'vitalik.eth' },
        'eth.ecs.ethstars.stars'
      )

      expect(result).toEqual({
        value: '12728',
        ensName: 'vitalik.eth.name.ecs.eth',
        credentialKey: 'eth.ecs.ethstars.stars',
        success: true
      })

      expect(mockPublicClient.getEnsText).toHaveBeenCalledWith({
        name: 'vitalik.eth.name.ecs.eth',
        key: 'eth.ecs.ethstars.stars'
      })
    })

    it('should resolve address-based credentials successfully', async () => {
      const mockTextRecord = '5432'
      vi.mocked(mockPublicClient.getEnsText).mockResolvedValue(mockTextRecord)

      const result = await resolver.resolveCredential(
        {
          type: 'address',
          address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
          coinType: '3c'
        },
        'eth.ecs.ethstars.stars'
      )

      expect(result).toEqual({
        value: '5432',
        ensName: 'd8da6bf26964af9d7eed9e03e53415d37aa96045.3c.addr.ecs.eth',
        credentialKey: 'eth.ecs.ethstars.stars',
        success: true
      })
    })

    it('should return null for empty text records', async () => {
      vi.mocked(mockPublicClient.getEnsText).mockResolvedValue('')

      const result = await resolver.resolveCredential(
        { type: 'name', name: 'vitalik.eth' },
        'eth.ecs.ethstars.stars'
      )

      expect(result).toEqual({
        value: null,
        ensName: 'vitalik.eth.name.ecs.eth',
        credentialKey: 'eth.ecs.ethstars.stars',
        success: false
      })
    })

    it('should handle ENS resolution errors gracefully', async () => {
      vi.mocked(mockPublicClient.getEnsText).mockRejectedValue(
        new Error('resolver not found')
      )

      const result = await resolver.resolveCredential(
        { type: 'name', name: 'nonexistent.eth' },
        'eth.ecs.ethstars.stars'
      )

      expect(result).toEqual({
        value: null,
        ensName: 'nonexistent.eth.name.ecs.eth',
        credentialKey: 'eth.ecs.ethstars.stars',
        success: false
      })
    })

    it('should handle timeout', async () => {
      vi.mocked(mockPublicClient.getEnsText).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('value'), 2000))
      )

      const result = await resolver.resolveCredential(
        { type: 'name', name: 'vitalik.eth' },
        'eth.ecs.ethstars.stars',
        { timeout: 100 }
      )

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/timed out/i)
    })

    it('should throw errors when throwOnError is true', async () => {
      vi.mocked(mockPublicClient.getEnsText).mockRejectedValue(
        new Error('Network error')
      )

      await expect(
        resolver.resolveCredential(
          { type: 'name', name: 'vitalik.eth' },
          'eth.ecs.ethstars.stars',
          { throwOnError: true }
        )
      ).rejects.toThrow()
    })
  })

  describe('resolveCredentialsBatch', () => {
    it('should resolve multiple credentials', async () => {
      vi.mocked(mockPublicClient.getEnsText)
        .mockResolvedValueOnce('100')
        .mockResolvedValueOnce('200')

      const requests = [
        {
          identifier: { type: 'name' as const, name: 'vitalik.eth' },
          credentialKey: 'eth.ecs.ethstars.stars'
        },
        {
          identifier: { type: 'name' as const, name: 'ethereum.eth' },
          credentialKey: 'eth.ecs.ethstars.stars'
        }
      ]

      const results = await resolver.resolveCredentialsBatch(requests)

      expect(results).toHaveLength(2)
      expect(results[0]?.value).toBe('100')
      expect(results[1]?.value).toBe('200')
    })
  })

  describe('resolveNameCredential', () => {
    it('should resolve name-based credential', async () => {
      vi.mocked(mockPublicClient.getEnsText).mockResolvedValue('12728')

      const result = await resolver.resolveNameCredential(
        'vitalik.eth',
        'eth.ecs.ethstars.stars'
      )

      expect(result.value).toBe('12728')
      expect(result.ensName).toBe('vitalik.eth.name.ecs.eth')
    })
  })

  describe('resolveAddressCredential', () => {
    it('should resolve address-based credential', async () => {
      vi.mocked(mockPublicClient.getEnsText).mockResolvedValue('5432')

      const result = await resolver.resolveAddressCredential(
        '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        'eth.ecs.ethstars.stars'
      )

      expect(result.value).toBe('5432')
      expect(result.ensName).toBe('d8da6bf26964af9d7eed9e03e53415d37aa96045.3c.addr.ecs.eth')
    })

    it('should accept custom coin type', async () => {
      vi.mocked(mockPublicClient.getEnsText).mockResolvedValue('1000')

      const result = await resolver.resolveAddressCredential(
        '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        'eth.ecs.ethstars.stars',
        '0'
      )

      expect(result.ensName).toBe('d8da6bf26964af9d7eed9e03e53415d37aa96045.0.addr.ecs.eth')
    })
  })



  describe('getENSName', () => {
    it('should return ENS name for name identifier', () => {
      const ensName = resolver.getENSName({ type: 'name', name: 'vitalik.eth' })
      expect(ensName).toBe('vitalik.eth.name.ecs.eth')
    })

    it('should return ENS name for address identifier', () => {
      const ensName = resolver.getENSName({
        type: 'address',
        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        coinType: '3c'
      })
      expect(ensName).toBe('d8da6bf26964af9d7eed9e03e53415d37aa96045.3c.addr.ecs.eth')
    })
  })
})

describe('createECSResolver', () => {
  it('should create resolver instance', () => {
    const mockPublicClient = {} as PublicClient
    const resolver = createECSResolver({ publicClient: mockPublicClient })
    expect(resolver).toBeInstanceOf(ECSResolver)
  })
})
