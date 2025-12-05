/**
 * ECS V2 Hooks Example
 * 
 * This example demonstrates the full Hooks flow:
 * 1. User has a hook in their ENS text record
 * 2. Client extracts resolver address from hook
 * 3. Client validates resolver via ECS Registry
 * 4. Client resolves credential from trusted resolver
 */

import 'dotenv/config'
import { 
  createECSClient, 
  sepolia, 
  getResolverInfo, 
  getResolverAge,
  resolveCredential 
} from '../src/index'

// Simulated hook parsing (in reality, you'd parse the actual hook format)
function parseHook(hookValue: string): string | null {
  // Hook format: hook("text(bytes32,string)", <ADDRESS>)
  const match = hookValue.match(/hook\("text\(bytes32,string\)",\s*([0x][a-fA-F0-9]{40})\)/)
  return match ? match[1] : null
}

async function hooksExample() {
  console.log('🔗 ECS V2 - Hooks Integration Example')
  console.log('=====================================\n')

  const client = createECSClient({
    chain: sepolia,
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'
  })

  try {
    // Step 1: User has hook in their ENS record
    console.log('1️⃣  User has hook in ENS text record')
    const userEnsName = 'maria.eth'
    const hookValue = 'hook("text(bytes32,string)", 0xB5D67A9bEf2052cC600f391A3997D46854cabC22)'
    
    console.log(`   ENS Name: ${userEnsName}`)
    console.log(`   Hook: ${hookValue}`)
    console.log()

    // Step 2: Extract resolver address from hook
    console.log('2️⃣  Extracting resolver address from hook...')
    const resolverAddress = parseHook(hookValue)
    
    if (!resolverAddress) {
      throw new Error('Invalid hook format')
    }
    
    console.log(`   Resolver Address: ${resolverAddress}`)
    console.log()

    // Step 3: Validate resolver via ECS Registry
    console.log('3️⃣  Validating resolver via ECS Registry...')
    const { label, resolverUpdated } = await getResolverInfo(
      client,
      resolverAddress as `0x${string}`
    )
    
    console.log(`   Label: ${label}`)
    console.log(`   Service: ${label}.ecs.eth`)
    
    const ageInDays = Math.floor(getResolverAge(resolverUpdated) / 86400)
    console.log(`   Resolver Age: ${ageInDays} days`)
    
    // Security check
    if (ageInDays < 30) {
      console.log(`   ⚠️  Warning: Resolver changed ${ageInDays} days ago`)
      console.log(`   Consider requiring manual review for new resolvers`)
    } else {
      console.log(`   ✅ Resolver is established (${ageInDays} days old)`)
    }
    console.log()

    // Step 4: Resolve credential from trusted resolver
    console.log('4️⃣  Resolving credential from trusted resolver...')
    const credentialKey = `eth.ecs.${label}.starts:vitalik.eth`
    console.log(`   Key: ${credentialKey}`)
    
    const credential = await resolveCredential(
      client,
      resolverAddress as `0x${string}`,
      credentialKey
    )
    
    if (credential !== null) {
      console.log(`   ✅ Verified Credential: ${credential} stars`)
      console.log()
      console.log(`   📊 Summary:`)
      console.log(`      - ${userEnsName} → hook → ${resolverAddress}`)
      console.log(`      - ${resolverAddress} → ${label}.ecs.eth`)
      console.log(`      - ${label}.ecs.eth[${credentialKey}] → "${credential}"`)
    } else {
      console.log('   ❌ Credential not found')
    }

    console.log('\n🎉 Hooks flow completed successfully!')
    console.log('💡 The credential was resolved without storing it on maria.eth')
    console.log('💡 Instead, it was fetched from a trusted, known resolver')
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  hooksExample().catch(console.error)
}

export { hooksExample }

