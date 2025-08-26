/**
 * Basic Usage Example
 * 
 * This example demonstrates the basic functionality of the ECS resolver library.
 */

import { createPublicClient, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { createECSResolver } from '../src/index'

async function basicUsageExample() {
  console.log('🌟 ECS Resolver - Basic Usage Example')
  console.log('=====================================\n')

  // Create a Viem public client for Sepolia testnet (where ECS is deployed)
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
  })

  // Create the ECS resolver
  const resolver = createECSResolver({ publicClient })

  try {
    console.log('📍 Resolving name-based credential...')
    
    // Resolve a name-based credential for vitalik.eth
    const nameResult = await resolver.resolveNameCredential(
      'vitalik.eth',
      'eth.ecs.ethstars.stars'
    )

    console.log('Result:', nameResult)
    if (nameResult.success) {
      console.log(`✅ vitalik.eth has ${nameResult.value} stars!`)
    } else {
      console.log('❌ Could not resolve credential')
    }

    console.log('\n📍 Resolving address-based credential...')
    
    // Resolve an address-based credential
    const addressResult = await resolver.resolveAddressCredential(
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      'eth.ecs.ethstars.stars'
    )

    console.log('Result:', addressResult)
    if (addressResult.success) {
      console.log(`✅ Address has ${addressResult.value} stars!`)
    } else {
      console.log('❌ Could not resolve credential')
    }

    console.log('\n📍 Getting credential metadata...')
    const metadata = resolver.getCredentialMetadata('eth.ecs.ethstars.stars')
    console.log('Metadata:', metadata)

    console.log('\n📍 Constructing ENS names...')
    const nameENS = resolver.getENSName({ type: 'name', name: 'vitalik.eth' })
    const addressENS = resolver.getENSName({
      type: 'address',
      address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
    })
    console.log('Name ENS:', nameENS)
    console.log('Address ENS:', addressENS)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  basicUsageExample().catch(console.error)
}

export { basicUsageExample }
