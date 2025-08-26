/**
 * Error Handling Example
 * 
 * This example demonstrates proper error handling with the ECS resolver library.
 */

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
  console.log('⚠️  ECS Resolver - Error Handling Example')
  console.log('=========================================\n')

  // Create a Viem public client for Sepolia testnet
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
  })

  // Create the ECS resolver
  const resolver = createECSResolver({ publicClient })

  // Example 1: Invalid identifier
  console.log('1️⃣ Testing invalid identifier...')
  try {
    await resolver.resolveNameCredential(
      '',  // Invalid empty name
      'eth.ecs.ethstars.stars'
    )
  } catch (error) {
    if (error instanceof InvalidIdentifierError) {
      console.log(`   ✅ Caught InvalidIdentifierError: ${error.message}`)
    } else {
      console.log(`   ❌ Unexpected error: ${error}`)
    }
  }

  // Example 2: Invalid credential key
  console.log('\n2️⃣ Testing invalid credential key...')
  try {
    await resolver.resolveNameCredential(
      'vitalik.eth',
      'invalid.key'  // Invalid credential key format
    )
  } catch (error) {
    if (error instanceof InvalidCredentialKeyError) {
      console.log(`   ✅ Caught InvalidCredentialKeyError: ${error.message}`)
    } else {
      console.log(`   ❌ Unexpected error: ${error}`)
    }
  }

  // Example 3: Graceful error handling (default behavior)
  console.log('\n3️⃣ Testing graceful error handling...')
  const result = await resolver.resolveNameCredential(
    'nonexistent-domain-that-should-not-exist.eth',
    'eth.ecs.ethstars.stars'
  )
  
  console.log(`   Success: ${result.success}`)
  if (!result.success) {
    console.log(`   ✅ Gracefully handled: ${result.error || 'Not found'}`)
  }

  // Example 4: Throwing on error
  console.log('\n4️⃣ Testing throwOnError option...')
  try {
    await resolver.resolveNameCredential(
      'nonexistent-domain-that-should-not-exist.eth',
      'eth.ecs.ethstars.stars',
      { throwOnError: true }
    )
  } catch (error) {
    if (error instanceof ENSResolutionError) {
      console.log(`   ✅ Caught ENSResolutionError: ${error.message}`)
    } else if (error instanceof ECSError) {
      console.log(`   ✅ Caught ECSError: ${error.message}`)
    } else {
      console.log(`   ❌ Unexpected error: ${error}`)
    }
  }

  // Example 5: Timeout handling
  console.log('\n5️⃣ Testing timeout handling...')
  const timeoutResult = await resolver.resolveNameCredential(
    'vitalik.eth',
    'eth.ecs.ethstars.stars',
    { timeout: 1 }  // Very short timeout
  )
  
  if (!timeoutResult.success && timeoutResult.error?.includes('timeout')) {
    console.log(`   ✅ Timeout handled gracefully: ${timeoutResult.error}`)
  } else {
    console.log(`   ❓ Timeout test inconclusive (request may have completed quickly)`)
  }

  // Example 6: Invalid address format
  console.log('\n6️⃣ Testing invalid address format...')
  try {
    await resolver.resolveAddressCredential(
      'invalid-address',
      'eth.ecs.ethstars.stars'
    )
  } catch (error) {
    if (error instanceof InvalidIdentifierError) {
      console.log(`   ✅ Caught InvalidIdentifierError: ${error.message}`)
    } else {
      console.log(`   ❌ Unexpected error: ${error}`)
    }
  }

  // Example 7: Batch error handling
  console.log('\n7️⃣ Testing batch error handling...')
  const batchResults = await resolver.resolveCredentialsBatch([
    {
      identifier: { type: 'name', name: 'vitalik.eth' },
      credentialKey: 'eth.ecs.ethstars.stars'
    },
    {
      identifier: { type: 'name', name: 'nonexistent.eth' },
      credentialKey: 'eth.ecs.ethstars.stars'
    }
  ])

  console.log(`   Batch results:`)
  batchResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    console.log(`   ${index + 1}. ${status} ${result.success ? result.value : result.error}`)
  })

  console.log('\n🎉 Error handling examples completed!')
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  errorHandlingExample().catch(console.error)
}

export { errorHandlingExample }
