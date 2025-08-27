/**
 * Error Handling Example
 * 
 * This example demonstrates proper error handling with the ecs.js library.
 */

import 'dotenv/config'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { 
  createECSResolver,
  ECSError,
  InvalidIdentifierError,
  InvalidCredentialKeyError,
  ResolutionTimeoutError,
  ENSResolutionError
} from '../src/index'

async function errorHandlingExample() {
  console.log('⚠️  ecs.js - Error Handling Example')
  console.log('=========================================\n')

  console.log('🚀 Simple Mode Error Handling')
  console.log('----------------------------')
  
  // Create a resolver in simple mode
  const simpleResolver = createECSResolver({ network: 'sepolia' })

  // Simple mode error handling
  console.log('1️⃣ Simple Mode - Testing non-existent credential...')
  const simpleResult = await simpleResolver.resolve('nonexistent.eth', 'eth.ecs.ethstars.stars')
  console.log(`   Simple mode result: ${simpleResult}`) // Returns null for failed resolution

  console.log('\n2️⃣ Simple Mode - Testing with details...')
  const detailedResult = await simpleResolver.resolveWithDetails('nonexistent.eth', 'eth.ecs.ethstars.stars')
  console.log(`   Success: ${detailedResult.success}`)
  if (!detailedResult.success) {
    console.log(`   Error: ${detailedResult.error}`)
  }

  console.log('\n🔧 Advanced Mode Error Handling')
  console.log('-----------------------------')
  
  // Create a Viem public client for Sepolia testnet
  if (!process.env.SEPOLIA_RPC_URL) {
    console.log('⚠️  Warning: SEPOLIA_RPC_URL not set in .env file. Using fallback RPC.')
  }
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo')
  })

  // Create the ecs.js resolver in advanced mode
  const resolver = createECSResolver({ publicClient })

  // Example 1: Non-existent credential
  console.log('1️⃣ Testing non-existent credential...')
  const result = await resolver.resolveWithDetails(
    'nonexistent-domain-that-should-not-exist.eth',
    'eth.ecs.ethstars.stars'
  )
  
  console.log(`   Success: ${result.success}`)
  if (!result.success) {
    console.log(`   ✅ Gracefully handled: ${result.error || 'Not found'}`)
  }

  // Example 2: Invalid address format
  console.log('\n2️⃣ Testing invalid address format...')
  const addressResult = await resolver.resolveAddressWithDetails(
    'invalid-address',
    'eth.ecs.ethstars.stars'
  )
  
  console.log(`   Success: ${addressResult.success}`)
  if (!addressResult.success) {
    console.log(`   ✅ Gracefully handled: ${addressResult.error}`)
  }

  // Example 3: Batch error handling
  console.log('\n3️⃣ Testing batch error handling...')
  const batchResults = await resolver.resolveBatch([
    { name: 'vitalik.eth', credential: 'eth.ecs.ethstars.stars' },
    { name: 'nonexistent.eth', credential: 'eth.ecs.ethstars.stars' }
  ])

  batchResults.forEach((result, index) => {
    if (result !== null) {
      console.log(`   ✅ Request ${index + 1}: ${result} stars`)
    } else {
      console.log(`   ❌ Request ${index + 1}: Failed`)
    }
  })

  // Example 4: Address batch error handling
  console.log('\n4️⃣ Testing address batch error handling...')
  const addressBatchResults = await resolver.resolveAddressBatch([
    { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', credential: 'eth.ecs.ethstars.stars' },
    { address: 'invalid-address', credential: 'eth.ecs.ethstars.stars' }
  ])

  addressBatchResults.forEach((result, index) => {
    if (result !== null) {
      console.log(`   ✅ Address request ${index + 1}: ${result} stars`)
    } else {
      console.log(`   ❌ Address request ${index + 1}: Failed`)
    }
  })

  console.log('\n🎉 Error handling examples completed!')

  console.log('\n🎉 Error handling examples completed!')
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  errorHandlingExample().catch(console.error)
}

export { errorHandlingExample }
