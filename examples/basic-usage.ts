/**
 * Basic Usage Example
 * 
 * This example demonstrates the basic functionality of the ecs.js library.
 * Shows the unified API that adapts based on your configuration.
 */

import 'dotenv/config'
import { createPublicClient, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { createECSResolver } from '../src/index'

async function basicUsageExample() {
  console.log('🌟 ecs.js - Basic Usage Example')
  console.log('=====================================\n')

  console.log('🚀 Simple Mode (Network Only)')
  console.log('----------------------------')
  
  // Create a resolver in simple mode (no viem setup needed)
  // For production, provide your own RPC URL
  const simpleResolver = createECSResolver({ 
    network: 'sepolia',
    rpcUrl: process.env.SEPOLIA_RPC_URL // Load environment variables in your app
  })

  try {
    console.log('📍 Simple Mode - Resolving name-based credential...')
    console.log('   Name: vitalik.eth')
    console.log('   Credential: eth.ecs.ethstars.stars')
    
    // Simple mode: just pass name and credential
    const simpleNameResult = await simpleResolver.resolve('vitalik.eth', 'eth.ecs.ethstars.stars')
    if (simpleNameResult !== null) {
      console.log(`   ✅ Result: ${simpleNameResult} stars`)
    } else {
      console.log('   ❌ Not found')
    }

    console.log('\n📍 Simple Mode - Resolving address-based credential (Ethereum)...')
    console.log('   Address: 0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
    console.log('   Credential: eth.ecs.ethstars.stars')
    console.log('   Coin Type: 3c (Ethereum - default)')
    const simpleAddressResult = await simpleResolver.resolveAddress(
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      'eth.ecs.ethstars.stars'
    )
    if (simpleAddressResult !== null) {
      console.log(`   ✅ Result: ${simpleAddressResult} stars`)
    } else {
      console.log('   ❌ Not found')
    }

    console.log('\n📍 Simple Mode - Resolving address-based credential (Bitcoin)...')
    console.log('   Address: 0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
    console.log('   Credential: eth.ecs.ethstars.stars')
    console.log('   Coin Type: 0 (Bitcoin)')
    const bitcoinAddressResult = await simpleResolver.resolveAddress(
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      'eth.ecs.ethstars.stars',
      '0' // Bitcoin coin type
    )
    if (bitcoinAddressResult !== null) {
      console.log(`   ✅ Result: ${bitcoinAddressResult} stars`)
    } else {
      console.log('   ❌ Not found`)
    }
  } catch (error) {
    console.error('❌ Simple mode error:', error)
  }

  console.log('\n🔧 Advanced Mode (Custom viem Client)')
  console.log('------------------------------------')
  
  // Create a Viem public client for Sepolia testnet (where ECS is deployed)
  // For production, provide your own RPC URL
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo')
  })

  // Create the resolver in advanced mode
  const resolver = createECSResolver({ publicClient })

  try {
    console.log('📍 Advanced Mode - Resolving name-based credential...')
    console.log('   Name: vitalik.eth')
    console.log('   Credential: eth.ecs.ethstars.stars')
    
    // Resolve a name-based credential for vitalik.eth
    const nameResult = await resolver.resolveWithDetails(
      'vitalik.eth',
      'eth.ecs.ethstars.stars'
    )

    if (nameResult.success) {
      console.log(`   ENS Name: ${nameResult.ensName}`)
      console.log(`   ✅ Result: ${nameResult.value} stars`)
    } else {
      console.log('   ❌ Could not resolve credential')
      if (nameResult.error) {
        console.log(`   Error: ${nameResult.error}`)
      }
    }

    console.log('\n📍 Advanced Mode - Resolving address-based credential (Ethereum)...')
    console.log('   Address: 0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
    console.log('   Credential: eth.ecs.ethstars.stars')
    console.log('   Coin Type: 3c (Ethereum - default)')
    
    // Resolve an address-based credential
    const addressResult = await resolver.resolveAddressWithDetails(
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      'eth.ecs.ethstars.stars'
    )

    if (addressResult.success) {
      console.log(`   ENS Name: ${addressResult.ensName}`)
      console.log(`   ✅ Result: ${addressResult.value} stars`)
    } else {
      console.log('   ❌ Could not resolve credential')
      if (addressResult.error) {
        console.log(`   Error: ${addressResult.error}`)
      }
    }

    console.log('\n📍 Utility - Constructing ENS names...')
    const nameENS = resolver.getENSName({ type: 'name', name: 'vitalik.eth' })
    const addressENS = resolver.getENSName({
      type: 'address',
      address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
    })
    const bitcoinENS = resolver.getENSName({
      type: 'address',
      address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      coinType: '0' // Bitcoin
    })
    console.log('   Name → ENS:', nameENS)
    console.log('   Address (Ethereum) → ENS:', addressENS)
    console.log('   Address (Bitcoin) → ENS:', bitcoinENS)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  basicUsageExample().catch(console.error)
}

export { basicUsageExample }
