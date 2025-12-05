/**
 * ECS V2 Security Example
 * 
 * This example demonstrates how to check resolver age and enforce
 * security policies before trusting credential data.
 */

import 'dotenv/config'
import { 
  createECSClient, 
  sepolia, 
  getResolverInfo, 
  getResolverAge,
  resolveCredential 
} from '../src/index'

async function securityExample() {
  console.log('🛡️  ECS V2 - Security Example')
  console.log('============================\n')

  const client = createECSClient({
    chain: sepolia,
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'
  })

  const resolverAddress = '0xB5D67A9bEf2052cC600f391A3997D46854cabC22'

  try {
    console.log('📍 Checking resolver security...')
    console.log()

    // Get resolver info
    const { label, resolverUpdated } = await getResolverInfo(client, resolverAddress)
    
    console.log(`   Resolver: ${label}.ecs.eth`)
    console.log(`   Address: ${resolverAddress}`)
    console.log(`   Last Updated: ${new Date(Number(resolverUpdated) * 1000).toISOString()}`)
    console.log()

    // Calculate age
    const ageInSeconds = getResolverAge(resolverUpdated)
    const ageInDays = Math.floor(ageInSeconds / 86400)
    const ageInHours = Math.floor((ageInSeconds % 86400) / 3600)

    console.log(`   Age: ${ageInDays} days, ${ageInHours} hours`)
    console.log()

    // Security policy: require 90+ days for high security
    const MIN_AGE_DAYS = 90

    console.log(`🔍 Security Policy Check (${MIN_AGE_DAYS}+ days required)`)
    
    if (ageInDays < MIN_AGE_DAYS) {
      console.log(`   ⚠️  WARNING: Resolver is only ${ageInDays} days old`)
      console.log(`   ⚠️  This may indicate:`)
      console.log(`      - Recent deployment (untested)`)
      console.log(`      - Resolver upgrade (needs review)`)
      console.log(`      - Potential security concern`)
      console.log()
      console.log(`   ❌ REJECTED: Does not meet security policy`)
      return
    }

    console.log(`   ✅ APPROVED: Resolver is ${ageInDays} days old (meets policy)`)
    console.log()

    // Proceed with credential resolution
    console.log('2️⃣  Resolving credential...')
    const credential = await resolveCredential(
      client,
      resolverAddress,
      'eth.ecs.name-stars.starts:vitalik.eth'
    )

    if (credential !== null) {
      console.log(`   ✅ Trusted Result: ${credential} stars`)
    } else {
      console.log('   ❌ Credential not found')
    }

    console.log('\n🎉 Security check completed successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  securityExample().catch(console.error)
}

export { securityExample }

