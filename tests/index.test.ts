/**
 * Tests for ecsjs V2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  createECSClient, 
  getResolverInfo, 
  resolveCredential, 
  getRegistryAddress,
  getResolverAge,
  sepolia,
  mainnet
} from '../src/index'
import type { PublicClient } from 'viem'

describe('ecsjs V2', () => {
  describe('createECSClient', () => {
    it('should create a viem public client', () => {
      const client = createECSClient({
        chain: sepolia,
        rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo'
      })
      
      expect(client).toBeDefined()
      expect(typeof client.readContract).toBe('function')
      expect(typeof client.getEnsText).toBe('function')
    })

    it('should use the provided chain', () => {
      const client = createECSClient({
        chain: sepolia,
        rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo'
      })
      
      expect(client.chain?.id).toBe(11155111) // Sepolia chain ID
    })
  })

  describe('getRegistryAddress', () => {
    it('should return Sepolia registry address', () => {
      const address = getRegistryAddress(11155111)
      expect(address).toBe('0xb09C149664773bFA88B72FA41437AdADcB8bF5B4')
    })

    it('should return zero address for mainnet (not deployed)', () => {
      const address = getRegistryAddress(1)
      expect(address).toBe('0x0000000000000000000000000000000000000000')
    })

    it('should return zero address for unknown chain', () => {
      const address = getRegistryAddress(999)
      expect(address).toBe('0x0000000000000000000000000000000000000000')
    })
  })

  describe('getResolverAge', () => {
    it('should calculate resolver age correctly', () => {
      const now = Math.floor(Date.now() / 1000)
      const oneDayAgo = BigInt(now - 86400) // 1 day ago
      
      const age = getResolverAge(oneDayAgo)
      
      expect(age).toBeGreaterThanOrEqual(86400) // At least 1 day
      expect(age).toBeLessThan(86400 + 10) // Less than 1 day + 10 seconds
    })

    it('should handle future timestamps gracefully', () => {
      const future = BigInt(Math.floor(Date.now() / 1000) + 86400)
      const age = getResolverAge(future)
      
      expect(age).toBeLessThan(0) // Negative age for future timestamps
    })
  })

  describe('getResolverInfo', () => {
    let mockClient: PublicClient

    beforeEach(() => {
      mockClient = {
        chain: { id: 11155111 },
        readContract: vi.fn()
      } as any
    })

    it('should query the registry contract', async () => {
      vi.mocked(mockClient.readContract).mockResolvedValue([
        'name-stars',
        BigInt(1764948384),
        ''
      ] as any)

      const result = await getResolverInfo(
        mockClient,
        '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa'
      )

      expect(mockClient.readContract).toHaveBeenCalledWith({
        address: '0xb09C149664773bFA88B72FA41437AdADcB8bF5B4',
        abi: expect.any(Array),
        functionName: 'getResolverInfo',
        args: ['0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa']
      })

      expect(result).toEqual({
        label: 'name-stars',
        resolverUpdated: BigInt(1764948384),
        review: ''
      })
    })

    it('should throw error if chain ID not available', async () => {
      mockClient.chain = undefined as any

      await expect(
        getResolverInfo(mockClient, '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa')
      ).rejects.toThrow('Client chain ID not available')
    })

    it('should throw error if registry not deployed', async () => {
      mockClient.chain = { id: 1 } as any // Mainnet (not deployed)

      await expect(
        getResolverInfo(mockClient, '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa')
      ).rejects.toThrow('ECS Registry not deployed on chain 1')
    })
  })

  describe('resolveCredential', () => {
    let mockClient: PublicClient

    beforeEach(() => {
      mockClient = {
        chain: { id: 11155111 },
        readContract: vi.fn(),
        getEnsText: vi.fn()
      } as any
    })

    it('should resolve credential from resolver address', async () => {
      // Mock getResolverInfo response
      vi.mocked(mockClient.readContract).mockResolvedValue([
        'name-stars',
        BigInt(1764948384),
        ''
      ] as any)

      // Mock ENS text resolution
      vi.mocked(mockClient.getEnsText).mockResolvedValue('100')

      const result = await resolveCredential(
        mockClient,
        '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa',
        'eth.ecs.name-stars.starts:vitalik.eth'
      )

      expect(mockClient.getEnsText).toHaveBeenCalledWith({
        name: 'name-stars.ecs.eth',
        key: 'eth.ecs.name-stars.starts:vitalik.eth'
      })

      expect(result).toBe('100')
    })

    it('should return null if credential not found', async () => {
      vi.mocked(mockClient.readContract).mockResolvedValue([
        'name-stars',
        BigInt(1764948384),
        ''
      ] as any)

      vi.mocked(mockClient.getEnsText).mockResolvedValue(null)

      const result = await resolveCredential(
        mockClient,
        '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa',
        'eth.ecs.name-stars.nonexistent:test.eth'
      )

      expect(result).toBeNull()
    })

    it('should construct correct ENS name from label', async () => {
      vi.mocked(mockClient.readContract).mockResolvedValue([
        'custom-service',
        BigInt(1234567890),
        ''
      ] as any)

      vi.mocked(mockClient.getEnsText).mockResolvedValue('result')

      await resolveCredential(
        mockClient,
        '0x9773397bd9366D80dAE708CA4C4413Abf88B3DAa',
        'some.credential.key'
      )

      expect(mockClient.getEnsText).toHaveBeenCalledWith({
        name: 'custom-service.ecs.eth',
        key: 'some.credential.key'
      })
    })
  })
})

