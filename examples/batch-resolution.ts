/**
 * Batch Resolution Example
 * 
 * This example demonstrates how to resolve multiple credentials in batch.
 */

import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { createECSResolver, type BatchCredentialRequest } from '../src/index'

async function batchResolutionExample() {
  console.log('🚀 ECS Resolver - Batch Resolution Example')
  console.log('==========================================\n')

  // Create a Viem public client for Sepolia testnet
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
  })

  // Create the ECS resolver
  const resolver = createECSResolver({ publicClient })

  try {
    // Define multiple credential requests
    const requests: BatchCredentialRequest[] = [
      {
        identifier: { type: 'name', name: 'vitalik.eth' },
        credentialKey: 'eth.ecs.ethstars.stars'
      },
      {
        identifier: { type: 'name', name: 'ethereum.eth' },
        credentialKey: 'eth.ecs.ethstars.stars'
      },
      {
        identifier: {
          type: 'address',
          address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        },
        credentialKey: 'eth.ecs.ethstars.stars'
      },
      {
        identifier: { type: 'name', name: 'nonexistent.eth' },
        credentialKey: 'eth.ecs.ethstars.stars'
      }
    ]

    console.log(`📦 Resolving ${requests.length} credentials in batch...`)

    // Resolve all credentials in batch
    const results = await resolver.resolveCredentialsBatch(requests)

    console.log('\n📊 Results:')
    console.log('===========')

    results.forEach((result, index) => {
      const { identifier, credentialKey } = result.request
      const identifierStr = identifier.type === 'name' 
        ? identifier.name 
        : `${identifier.address} (${identifier.coinType || '3c'})`

      console.log(`\n${index + 1}. ${identifierStr}`)
      console.log(`   Credential: ${credentialKey}`)
      console.log(`   ENS Name: ${result.ensName}`)
      console.log(`   Success: ${result.success}`)
      
      if (result.success) {
        console.log(`   ✅ Value: ${result.value}`)
      } else {
        console.log(`   ❌ Error: ${result.error || 'Not found'}`)
      }
    })

    // Calculate statistics
    const successful = results.filter(r => r.success).length
    const failed = results.length - successful

    console.log(`\n📈 Statistics:`)
    console.log(`   Total requests: ${results.length}`)
    console.log(`   Successful: ${successful}`)
    console.log(`   Failed: ${failed}`)
    console.log(`   Success rate: ${((successful / results.length) * 100).toFixed(1)}%`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  batchResolutionExample().catch(console.error)
}

export { batchResolutionExample }
