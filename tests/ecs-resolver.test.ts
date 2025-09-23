import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createECSResolver } from '../src/ecs-resolver'
import type { PublicClient } from 'viem'

describe('ecs.js', () => {
  it('should create a resolver in simple mode with network', () => {
    const resolver = createECSResolver({ network: 'sepolia' })
    expect(resolver).toBeDefined()
    expect(typeof resolver.resolve).toBe('function')
    expect(typeof resolver.resolveAddress).toBe('function')
  })

  it('should create a resolver in simple mode with custom RPC', () => {
    const resolver = createECSResolver({ 
      network: 'sepolia',
      rpcUrl: 'https://custom-rpc.sepolia.org'
    })
    expect(resolver).toBeDefined()
  })

  it('should create a resolver in advanced mode with publicClient', () => {
    // Mock publicClient for testing
    const mockPublicClient = {} as any
    const resolver = createECSResolver({ publicClient: mockPublicClient })
    expect(resolver).toBeDefined()
  })

  it('should have batch methods', () => {
    const resolver = createECSResolver({ network: 'sepolia' })
    expect(typeof resolver.resolveBatch).toBe('function')
    expect(typeof resolver.resolveAddressBatch).toBe('function')
  })

  it('should have utility methods', () => {
    const resolver = createECSResolver({ network: 'sepolia' })
    expect(typeof resolver.getENSName).toBe('function')
  })

  it('should throw error when neither network nor publicClient provided', () => {
    expect(() => createECSResolver({} as any)).toThrow('Must provide either network or publicClient')
  })

  describe('coinType parameter support', () => {
    it('should accept coinType parameter in resolveAddress', () => {
      const resolver = createECSResolver({ network: 'sepolia' })
      // Test that the method signature accepts coinType parameter
      expect(typeof resolver.resolveAddress).toBe('function')
      
      // The method should accept 3 parameters: address, credential, coinType
      const methodString = resolver.resolveAddress.toString()
      expect(methodString).toContain('coinType')
    })

    it('should accept coinType parameter in resolveAddressWithDetails', () => {
      const resolver = createECSResolver({ network: 'sepolia' })
      // Test that the method signature accepts coinType parameter
      expect(typeof resolver.resolveAddressWithDetails).toBe('function')
      
      // The method should accept 3 parameters: address, credential, coinType
      const methodString = resolver.resolveAddressWithDetails.toString()
      expect(methodString).toContain('coinType')
    })

    it('should accept coinType parameter in resolveAddressBatch', () => {
      const resolver = createECSResolver({ network: 'sepolia' })
      // Test that the method signature accepts coinType parameter
      expect(typeof resolver.resolveAddressBatch).toBe('function')
      
      // The method should accept requests with coinType
      const methodString = resolver.resolveAddressBatch.toString()
      expect(methodString).toContain('coinType')
    })

    it('should construct correct ENS names with different coin types', () => {
      const resolver = createECSResolver({ network: 'sepolia' })
      const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
      
      // Test Ethereum (default)
      const ethName = resolver.getENSName({ 
        type: 'address', 
        address, 
        coinType: '3c' 
      })
      expect(ethName).toBe('d8da6bf26964af9d7eed9e03e53415d37aa96045.3c.addr.ecs.eth')
      
      // Test Bitcoin
      const btcName = resolver.getENSName({ 
        type: 'address', 
        address, 
        coinType: '0' 
      })
      expect(btcName).toBe('d8da6bf26964af9d7eed9e03e53415d37aa96045.0.addr.ecs.eth')
      
      // Test Litecoin
      const ltcName = resolver.getENSName({ 
        type: 'address', 
        address, 
        coinType: '2' 
      })
      expect(ltcName).toBe('d8da6bf26964af9d7eed9e03e53415d37aa96045.2.addr.ecs.eth')
      
      // Test Bitcoin Cash
      const bchName = resolver.getENSName({ 
        type: 'address', 
        address, 
        coinType: '91' 
      })
      expect(bchName).toBe('d8da6bf26964af9d7eed9e03e53415d37aa96045.91.addr.ecs.eth')
    })
  })

  describe('coinType functionality with mocked resolver', () => {
    let mockPublicClient: PublicClient
    let resolver: any

    beforeEach(() => {
      // Mock the public client
      mockPublicClient = {
        getEnsText: vi.fn()
      } as any

      // Create resolver with mocked client
      resolver = createECSResolver({ publicClient: mockPublicClient })
    })

    it('should resolve address with different coin types', async () => {
      const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
      const credential = 'eth.ecs.ethstars.stars'

      // Mock different responses for different coin types
      vi.mocked(mockPublicClient.getEnsText).mockImplementation(({ name }) => {
        if (name.includes('.3c.addr.')) {
          return Promise.resolve('100') // Ethereum result
        } else if (name.includes('.0.addr.')) {
          return Promise.resolve('50') // Bitcoin result
        } else if (name.includes('.2.addr.')) {
          return Promise.resolve('25') // Litecoin result
        } else if (name.includes('.91.addr.')) {
          return Promise.resolve('75') // Bitcoin Cash result
        }
        return Promise.resolve(null)
      })

      // Test Ethereum (default)
      const ethResult = await resolver.resolveAddress(address, credential)
      expect(ethResult).toBe('100')
      expect(mockPublicClient.getEnsText).toHaveBeenCalledWith({
        name: 'd8da6bf26964af9d7eed9e03e53415d37aa96045.3c.addr.ecs.eth',
        key: credential
      })

      // Test Bitcoin
      const btcResult = await resolver.resolveAddress(address, credential, '0')
      expect(btcResult).toBe('50')
      expect(mockPublicClient.getEnsText).toHaveBeenCalledWith({
        name: 'd8da6bf26964af9d7eed9e03e53415d37aa96045.0.addr.ecs.eth',
        key: credential
      })

      // Test Litecoin
      const ltcResult = await resolver.resolveAddress(address, credential, '2')
      expect(ltcResult).toBe('25')
      expect(mockPublicClient.getEnsText).toHaveBeenCalledWith({
        name: 'd8da6bf26964af9d7eed9e03e53415d37aa96045.2.addr.ecs.eth',
        key: credential
      })

      // Test Bitcoin Cash
      const bchResult = await resolver.resolveAddress(address, credential, '91')
      expect(bchResult).toBe('75')
      expect(mockPublicClient.getEnsText).toHaveBeenCalledWith({
        name: 'd8da6bf26964af9d7eed9e03e53415d37aa96045.91.addr.ecs.eth',
        key: credential
      })
    })

    it('should handle batch resolution with different coin types', async () => {
      const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
      const credential = 'eth.ecs.ethstars.stars'

      // Mock responses
      vi.mocked(mockPublicClient.getEnsText).mockImplementation(({ name }) => {
        if (name.includes('.3c.addr.')) {
          return Promise.resolve('100')
        } else if (name.includes('.0.addr.')) {
          return Promise.resolve('50')
        }
        return Promise.resolve(null)
      })

      const batchRequests = [
        { address, credential }, // Ethereum (default)
        { address, credential, coinType: '0' } // Bitcoin
      ]

      const results = await resolver.resolveAddressBatch(batchRequests)
      expect(results).toEqual(['100', '50'])
    })

    it('should return null for non-existent coin type credentials', async () => {
      const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
      const credential = 'eth.ecs.ethstars.stars'

      // Mock no results
      vi.mocked(mockPublicClient.getEnsText).mockResolvedValue(null)

      const result = await resolver.resolveAddress(address, credential, '0')
      expect(result).toBeNull()
    })
  })
})
