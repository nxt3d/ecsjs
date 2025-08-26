/**
 * Batch Resolution Example
 * 
 * This example demonstrates how to resolve multiple credentials in batch.
 */

import 'dotenv/config'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { createECSResolver } from '../src/index'

async function batchResolutionExample() {
  console.log('🚀 ECS Resolver - Batch Resolution Example')
  console.log('==========================================\n')

  // Create a Viem public client for Sepolia testnet
  if (!process.env.SEPOLIA_RPC_URL) {
    console.log('⚠️  Warning: SEPOLIA_RPC_URL not set in .env file. Using fallback RPC.')
  }
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo')
  })

  // Create the ECS resolver
  const resolver = createECSResolver({ publicClient })

  try {
    // Define multiple credential requests for name-based resolution
    const nameRequests = [
      { name: 'vitalik.eth', credential: 'eth.ecs.ethstars.stars' },
      { name: 'ethereum.eth', credential: 'eth.ecs.ethstars.stars' },
      { name: 'nonexistent.eth', credential: 'eth.ecs.ethstars.stars' }
    ]

    console.log(`📦 Resolving ${nameRequests.length} name-based credentials in batch...`)

    // Resolve all name-based credentials in batch
    const nameResults = await resolver.resolveBatch(nameRequests)

    console.log('\n📊 Name-based Results:')
    console.log('=====================')

    nameResults.forEach((result, index) => {
      const request = nameRequests[index]
      console.log(`\n${index + 1}. ${request.name}`)
      console.log(`   Credential: ${request.credential}`)
      
      if (result !== null) {
        console.log(`   ✅ Value: ${result}`)
      } else {
        console.log(`   ❌ Not found`)
      }
    })

    // Define multiple credential requests for address-based resolution
    const addressRequests = [
      { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', credential: 'eth.ecs.ethstars.stars' },
      { address: '0x0000000000000000000000000000000000000000', credential: 'eth.ecs.ethstars.stars' }
    ]

    console.log(`\n📦 Resolving ${addressRequests.length} address-based credentials in batch...`)

    // Resolve all address-based credentials in batch
    const addressResults = await resolver.resolveAddressBatch(addressRequests)

    console.log('\n📊 Address-based Results:')
    console.log('========================')

    addressResults.forEach((result, index) => {
      const request = addressRequests[index]
      console.log(`\n${index + 1}. ${request.address}`)
      console.log(`   Credential: ${request.credential}`)
      
      if (result !== null) {
        console.log(`   ✅ Value: ${result}`)
      } else {
        console.log(`   ❌ Not found`)
      }
    })

    // Calculate statistics
    const allResults = [...nameResults, ...addressResults]
    const successful = allResults.filter(r => r !== null).length
    const failed = allResults.length - successful

    console.log(`\n📈 Statistics:`)
    console.log(`   Total requests: ${allResults.length}`)
    console.log(`   Successful: ${successful}`)
    console.log(`   Failed: ${failed}`)
    console.log(`   Success rate: ${((successful / allResults.length) * 100).toFixed(1)}%`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  batchResolutionExample().catch(console.error)
}

export { batchResolutionExample }
