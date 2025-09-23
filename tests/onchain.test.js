import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { createECSResolver } from '../dist/index.js'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Ethereum Credential Service (ECS) Demo Script - Using ECS Resolver
 * 
 * This script demonstrates how to query credentials from the ECS system
 * using our new ECS Resolver library that wraps Viem.
 */

const main = async () => {
  console.log("🌟 Ethereum Credential Service (ECS) - ECS Resolver");
  console.log("===================================================\n");
  
  console.log("The credentials we are resolving are:");
  console.log("");
  console.log("eth.ecs.ethstars.stars");
  console.log("");
  console.log("for:");
  console.log("- vitalik.eth");
  console.log("- 0xd8da6bf26964af9d7eed9e03e53415d37aa96045\n");
  
  // Initialize Viem public client
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL)
  })

  // Create ECS resolver
  const resolver = createECSResolver({ publicClient })
  
  // Vitalik's information
  const ensName = "vitalik.eth"
  const walletAddress = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
  const credentialKey = "eth.ecs.ethstars.stars"
  
  try {
    // Name-based resolution
    console.log("🔍 Name-based Resolution");
    console.log("------------------------");
    
    const nameResult = await resolver.resolveWithDetails(ensName, credentialKey)
    console.log(`📍 ENS Name: ${nameResult.ensName}`);
    
    if (nameResult.success) {
      console.log(`✅ Resolver Found: Working!`);
      console.log(`\n${ensName}`);
      console.log(`Number of Stars: ${nameResult.value}\n`);
    } else {
      console.log("❌ No resolver found for name-based lookup\n");
    }
    
    // Address-based resolution (Ethereum - default)
    console.log("🔍 Address-based Resolution (Ethereum - default)");
    console.log("-----------------------------------------------");
    
    const addressResult = await resolver.resolveAddressWithDetails(walletAddress, credentialKey)
    console.log(`📍 ENS Name: ${addressResult.ensName}`);
    
    if (addressResult.success) {
      console.log(`✅ Resolver Found: Working!`);
      console.log(`\n${walletAddress} (Ethereum):`);
      console.log(`Number of Stars: ${addressResult.value}\n`);
    } else {
      console.log("❌ No resolver found for address-based lookup\n");
    }

    // Address-based resolution (Bitcoin)
    console.log("🔍 Address-based Resolution (Bitcoin)");
    console.log("------------------------------------");
    
    const bitcoinResult = await resolver.resolveAddressWithDetails(walletAddress, credentialKey, '0')
    console.log(`📍 ENS Name: ${bitcoinResult.ensName}`);
    
    if (bitcoinResult.success) {
      console.log(`✅ Resolver Found: Working!`);
      console.log(`\n${walletAddress} (Bitcoin):`);
      console.log(`Number of Stars: ${bitcoinResult.value}\n`);
    } else {
      console.log("❌ No resolver found for Bitcoin address-based lookup\n");
    }

    // Address-based resolution (Litecoin)
    console.log("🔍 Address-based Resolution (Litecoin)");
    console.log("-------------------------------------");
    
    const litecoinResult = await resolver.resolveAddressWithDetails(walletAddress, credentialKey, '2')
    console.log(`📍 ENS Name: ${litecoinResult.ensName}`);
    
    if (litecoinResult.success) {
      console.log(`✅ Resolver Found: Working!`);
      console.log(`\n${walletAddress} (Litecoin):`);
      console.log(`Number of Stars: ${litecoinResult.value}\n`);
    } else {
      console.log("❌ No resolver found for Litecoin address-based lookup\n");
    }

    // Address-based resolution (Coin Type 10)
    console.log("🔍 Address-based Resolution (Coin Type 10)");
    console.log("----------------------------------------");
    
    const coinType10Result = await resolver.resolveAddressWithDetails(walletAddress, credentialKey, 'a') // 10 in hex
    console.log(`📍 ENS Name: ${coinType10Result.ensName}`);
    
    if (coinType10Result.success) {
      console.log(`✅ Resolver Found: Working!`);
      console.log(`\n${walletAddress} (Coin Type 10):`);
      console.log(`Number of Stars: ${coinType10Result.value}\n`);
    } else {
      console.log("❌ No resolver found for Coin Type 10 address-based lookup\n");
    }

    // Address-based resolution (Base Sepolia - same as Ethereum)
    console.log("🔍 Address-based Resolution (Base Sepolia)");
    console.log("----------------------------------------");
    
    const baseSepoliaResult = await resolver.resolveAddressWithDetails(walletAddress, credentialKey, '3c') // Base Sepolia uses same coin type as Ethereum
    console.log(`📍 ENS Name: ${baseSepoliaResult.ensName}`);
    
    if (baseSepoliaResult.success) {
      console.log(`✅ Resolver Found: Working!`);
      console.log(`\n${walletAddress} (Base Sepolia):`);
      console.log(`Number of Stars: ${baseSepoliaResult.value}\n`);
    } else {
      console.log("❌ No resolver found for Base Sepolia address-based lookup\n");
    }
    
    console.log("🎉 Demo completed successfully!");
    console.log("💡 Both name-based and address-based resolution work via our ECS Resolver library!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};

main();
