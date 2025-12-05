/**
 * Basic ECS V2 Usage Example
 * 
 * This example demonstrates basic credential resolution using ECS V2.
 */

import 'dotenv/config'
import { createECSClient, sepolia, resolveCredential, getResolverInfo } from '../src/index'

async function basicExample() {
  console.log('🌟 ECS V2 - Basic Usage Example')
  console.log('================================\n')

  // Create a client
  const client = createECSClient({
    chain: sepolia,
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'
  })

  // Known resolver address (name-stars service)
  const resolverAddress = '0xB5D67A9bEf2052cC600f391A3997D46854cabC22'

  try {
    console.log('📍 Resolver Address:', resolverAddress)
    console.log()

    // Get resolver info
    console.log('1️⃣  Getting resolver info...')
    const { label, resolverUpdated } = await getResolverInfo(client, resolverAddress)
    
    console.log(`   Label: ${label}`)
    console.log(`   ENS Name: ${label}.ecs.eth`)
    console.log(`   Last Updated: ${resolverUpdated}`)
    console.log()

    // Resolve credential
    console.log('2️⃣  Resolving credential...')
    const credentialKey = 'eth.ecs.name-stars.starts:vitalik.eth'
    console.log(`   Key: ${credentialKey}`)
    
    const credential = await resolveCredential(client, resolverAddress, credentialKey)
    
    if (credential !== null) {
      console.log(`   ✅ Result: ${credential} stars`)
    } else {
      console.log('   ❌ Credential not found')
    }

    console.log('\n🎉 Example completed successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  basicExample().catch(console.error)
}

export { basicExample }

