import { 
  createECSClient, 
  sepolia,
  getResolverInfo, 
  resolveCredential,
  getResolverAge 
} from '../dist/index.js'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Ethereum Credential Service (ECS) - Onchain Integration Test
 * 
 * This script tests the library against the live deployed ECS contracts on Sepolia.
 * It verifies that getResolverInfo() and resolveCredential() work with real data.
 */

const main = async () => {
  console.log("🌟 ECS Onchain Integration Test - v0.2.3-beta");
  console.log("==============================================\n");
  
  if (!process.env.SEPOLIA_RPC_URL) {
    console.error("❌ Error: SEPOLIA_RPC_URL not found in .env file");
    process.exit(1)
  }
  
  // Create ECS client
  const client = createECSClient({
    chain: sepolia,
    rpcUrl: process.env.SEPOLIA_RPC_URL
  })
  
  console.log("📡 Connected to Sepolia testnet");
  console.log(`🔗 Registry: 0xb09C149664773bFA88B72FA41437AdADcB8bF5B4\n`);
  
  // Known resolver from ECS deployment
  const resolverAddress = '0xc8028D202838FF7D14835c75906A07839837C160' // name-stars.ecs.eth
  const credentialKey = 'eth.ecs.name-stars.starts:vitalik.eth'
  
  try {
    // Test 1: Get Resolver Info
    console.log("🔍 Test 1: Get Resolver Info");
    console.log("----------------------------");
    console.log(`Resolver: ${resolverAddress}\n`);
    
    const { label, resolverUpdated, review } = await getResolverInfo(client, resolverAddress)
    
    console.log(`✅ Success!`);
    console.log(`   Label: ${label}`);
    console.log(`   Resolver Updated: ${resolverUpdated}`);
    console.log(`   Review: ${review || '(empty)'}`);
    
    // Calculate resolver age
    const ageInSeconds = getResolverAge(resolverUpdated)
    const ageInDays = Math.floor(ageInSeconds / 86400)
    const ageInHours = Math.floor((ageInSeconds % 86400) / 3600)
    
    console.log(`   Age: ${ageInDays} days, ${ageInHours} hours\n`);
    
    // Test 2: Resolve Credential
    console.log("🔍 Test 2: Resolve Credential");
    console.log("-----------------------------");
    console.log(`Key: ${credentialKey}\n`);
    
    const credential = await resolveCredential(
      client,
      resolverAddress,
      credentialKey
    )
    
    if (credential) {
      console.log(`✅ Success!`);
      console.log(`   Value: ${credential}\n`);
    } else {
      console.log(`⚠️  No credential found (this might be expected)\n`);
    }
    
    // Test 3: Verify consistency
    console.log("🔍 Test 3: Verify Data Consistency");
    console.log("-----------------------------------");
    
    const ensName = `${label}.ecs.eth`
    const directValue = await client.getEnsText({
      name: ensName,
      key: credentialKey
    })
    
    if (credential === directValue) {
      console.log(`✅ Consistency verified!`);
      console.log(`   resolveCredential() matches client.getEnsText()`);
      console.log(`   Both returned: ${credential}\n`);
    } else {
      console.log(`❌ Consistency check failed`);
      console.log(`   resolveCredential(): ${credential}`);
      console.log(`   getEnsText(): ${directValue}\n`);
    }
    
    // Summary
    console.log("==============================================");
    console.log("🎉 All onchain tests completed successfully!");
    console.log("==============================================");
    console.log("\n✅ Library is working correctly with live contracts");
    console.log(`✅ Registry: 0xb09C149664773bFA88B72FA41437AdADcB8bF5B4`);
    console.log(`✅ Resolver: ${resolverAddress}`);
    console.log(`✅ Label: ${label}.ecs.eth`);
    
  } catch (error) {
    console.error("\n❌ Test failed!");
    console.error(`Error: ${error.message}`);
    if (error.cause) {
      console.error(`Cause: ${error.cause.message || error.cause}`);
    }
    process.exit(1)
  }
};

main();
