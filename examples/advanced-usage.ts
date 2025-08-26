/**
 * Advanced Usage Example
 * 
 * This example demonstrates advanced features and use cases of the ECS resolver library.
 */

import { createPublicClient, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { 
  createECSResolver,
  createNameIdentifier,
  createAddressIdentifier,
  parseCredentialKey,
  constructENSName,
  type CredentialIdentifier
} from '../src/index'

async function advancedUsageExample() {
  console.log('🔬 ECS Resolver - Advanced Usage Example')
  console.log('========================================\n')

  // Create clients for different networks
  const sepoliaClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
  })

  const mainnetClient = createPublicClient({
    chain: mainnet,
    transport: http(process.env.MAINNET_RPC_URL || 'https://rpc.ankr.com/eth')
  })

  // Create resolvers for different networks
  const sepoliaResolver = createECSResolver({ publicClient: sepoliaClient })
  const mainnetResolver = createECSResolver({ 
    publicClient: mainnetClient,
    ecsDomain: 'ecs.eth' // Custom domain (though this would be the default)
  })

  console.log('1️⃣ Using factory functions for identifiers...')
  
  // Use factory functions to create identifiers
  const nameId = createNameIdentifier('vitalik.eth')
  const addressId = createAddressIdentifier('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
  const btcAddressId = createAddressIdentifier('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', '0') // Bitcoin

  console.log('   Name identifier:', nameId)
  console.log('   Address identifier:', addressId)
  console.log('   Bitcoin address identifier:', btcAddressId)

  console.log('\n2️⃣ Parsing credential keys...')
  
  // Parse different credential key formats
  const credentials = [
    'eth.ecs.ethstars.stars',
    'eth.ecs.reputation.score',
    'eth.ecs.social.twitter.verified',
    'eth.ecs.defi.compound.borrowed'
  ]

  credentials.forEach(key => {
    const metadata = parseCredentialKey(key)
    console.log(`   ${key}:`)
    console.log(`     Namespace: ${metadata.namespace}`)
    console.log(`     Name: ${metadata.name}`)
  })

  console.log('\n3️⃣ Constructing ENS names manually...')
  
  const identifiers: CredentialIdentifier[] = [
    { type: 'name', name: 'ethereum.org' },
    { type: 'name', name: 'uniswap.eth' },
    { type: 'address', address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' },
    { type: 'address', address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', coinType: '0' }
  ]

  identifiers.forEach(id => {
    const ensName = constructENSName(id)
    const idStr = id.type === 'name' ? id.name : `${id.address} (${id.coinType || '3c'})`
    console.log(`   ${idStr} -> ${ensName}`)
  })

  console.log('\n4️⃣ Resolving with different options...')
  
  try {
    // Resolve with custom timeout
    const quickResult = await sepoliaResolver.resolveNameCredential(
      'vitalik.eth',
      'eth.ecs.ethstars.stars',
      { timeout: 5000 }
    )
    console.log(`   Quick resolution (5s timeout): ${quickResult.success ? quickResult.value : 'Failed'}`)

    // Resolve with error throwing enabled
    const strictResult = await sepoliaResolver.resolveNameCredential(
      'vitalik.eth',
      'eth.ecs.ethstars.stars',
      { throwOnError: false }
    )
    console.log(`   Strict resolution: ${strictResult.success ? strictResult.value : 'Failed gracefully'}`)

  } catch (error) {
    console.log(`   ❌ Error in resolution: ${error}`)
  }

  console.log('\n5️⃣ Working with multiple credential types...')
  
  const multiCredentialRequests = [
    {
      identifier: nameId,
      credentialKey: 'eth.ecs.ethstars.stars'
    },
    {
      identifier: nameId,
      credentialKey: 'eth.ecs.reputation.score'
    },
    {
      identifier: addressId,
      credentialKey: 'eth.ecs.ethstars.stars'
    }
  ]

  const multiResults = await sepoliaResolver.resolveCredentialsBatch(multiCredentialRequests)
  
  console.log('   Multi-credential results:')
  multiResults.forEach((result, index) => {
    const credentialName = parseCredentialKey(result.request.credentialKey).name
    console.log(`     ${credentialName}: ${result.success ? result.value : 'Not found'}`)
  })

  console.log('\n6️⃣ Cross-chain resolution simulation...')
  
  // Note: This would work if ECS was deployed on mainnet
  // For now, we'll demonstrate the pattern
  
  const crossChainIdentifiers = [
    createNameIdentifier('vitalik.eth'),
    createAddressIdentifier('0xd8da6bf26964af9d7eed9e03e53415d37aa96045'),
  ]

  console.log('   Cross-chain ENS names:')
  crossChainIdentifiers.forEach(id => {
    const sepoliaENS = sepoliaResolver.getENSName(id)
    const mainnetENS = mainnetResolver.getENSName(id)
    
    const idStr = id.type === 'name' ? id.name : id.address.slice(0, 10) + '...'
    console.log(`     ${idStr}:`)
    console.log(`       Sepolia: ${sepoliaENS}`)
    console.log(`       Mainnet: ${mainnetENS}`)
  })

  console.log('\n7️⃣ Utility function demonstrations...')
  
  // Demonstrate various utilities
  console.log('   Getting metadata for complex credential:')
  const complexCredential = 'eth.ecs.defi.compound.v2.borrowed.usdc'
  try {
    const complexMetadata = parseCredentialKey(complexCredential)
    console.log(`     Key: ${complexMetadata.key}`)
    console.log(`     Namespace: ${complexMetadata.namespace}`)
    console.log(`     Name: ${complexMetadata.name}`)
  } catch (error) {
    console.log(`     ❌ Invalid credential format: ${error}`)
  }

  console.log('\n🎉 Advanced usage examples completed!')
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  advancedUsageExample().catch(console.error)
}

export { advancedUsageExample }
