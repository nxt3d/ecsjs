import { describe, it, expect } from 'vitest'
import { createECSResolver } from '../src/ecs-resolver'

describe('ECS Resolver', () => {
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
})
