import { ethers } from "ethers";

// Contract ABI for MyToken
export const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function nonces(address) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
  "function transfer(address,uint256) returns (bool)",
  "function transferFrom(address,address,uint256) returns (bool)",
  "function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)",
];

// Replace with your deployed contract address
export const TOKEN_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Latest Anvil deployment with correct PERMIT_TYPEHASH

// EIP-712 Domain
export const EIP712_DOMAIN = {
  name: "MyToken",
  version: "1",
  verifyingContract: TOKEN_ADDRESS,
};

// Permit TypeData
export const PERMIT_TYPE = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

/**
 * Sign a permit using EIP-712
 */
export async function signPermit(
  signer,
  owner,
  spender,
  value,
  deadline,
  chainId
) {
  try {
    // Get contract instance to fetch nonce
    const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
    const nonce = await contract.nonces(owner);

    // Get the actual domain separator from the contract
    const contractDomainSeparator = await contract.DOMAIN_SEPARATOR();
    console.log("Contract DOMAIN_SEPARATOR:", contractDomainSeparator);

    // Create domain with chainId - must match exactly what the contract expects
    const domain = {
      name: "MyToken",
      version: "1",
      chainId: chainId,
      verifyingContract: TOKEN_ADDRESS,
    };

    // Create permit data - must match exactly what the contract expects
    const permitData = {
      owner,
      spender,
      value: value.toString(), // Ensure it's a string representation
      nonce: nonce.toString(), // Ensure it's a string representation
      deadline: deadline.toString(), // Ensure it's a string representation
    };

    console.log("=== SIGNING DEBUG INFO ===");
    console.log("Contract Address:", TOKEN_ADDRESS);
    console.log("Chain ID:", chainId);
    console.log("Domain:", domain);
    console.log("Permit Data:", permitData);
    console.log("Nonce from contract:", nonce.toString());
    console.log("========================");

    // Sign the permit
    const signature = await signer.signTypedData(
      domain,
      PERMIT_TYPE,
      permitData
    );

    console.log("Raw signature:", signature);

    // Split signature
    const { r, s, v } = ethers.Signature.from(signature);

    console.log("Split signature - v:", v, "r:", r, "s:", s);

    return {
      signature,
      r,
      s,
      v,
      nonce,
      permitData,
      domain,
    };
  } catch (error) {
    console.error("Error signing permit:", error);
    throw error;
  }
}

/**
 * Execute permit on-chain
 */
export async function executePermit(
  signer,
  owner,
  spender,
  value,
  deadline,
  v,
  r,
  s
) {
  try {
    const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

    // Get current contract state for debugging
    const currentNonce = await contract.nonces(owner);
    const domainSeparator = await contract.DOMAIN_SEPARATOR();

    console.log("=== EXECUTION DEBUG INFO ===");
    console.log("Contract Address:", TOKEN_ADDRESS);
    console.log("Current nonce for owner:", currentNonce.toString());
    console.log("Contract DOMAIN_SEPARATOR:", domainSeparator);
    console.log("Execution params:", {
      owner,
      spender,
      value: value.toString(),
      deadline,
      v: v.toString(),
      r,
      s,
    });
    console.log("============================");

    const tx = await contract.permit(owner, spender, value, deadline, v, r, s);
    console.log("Permit transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Permit executed successfully:", receipt.hash);

    return receipt;
  } catch (error) {
    console.error("Error executing permit:", error);
    throw error;
  }
}

/**
 * Execute transferFrom using the permit allowance
 */
export async function executeTransferFrom(signer, from, to, amount) {
  try {
    const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

    // Get current allowance and caller info for debugging
    const signerAddress = await signer.getAddress();
    const currentAllowance = await contract.allowance(from, signerAddress);
    const fromBalance = await contract.balanceOf(from);

    // Ensure amount is in the correct format (BigInt)
    const amountWei =
      typeof amount === "string" ? ethers.parseEther(amount) : amount;

    console.log("=== TRANSFERFROM DEBUG INFO ===");
    console.log("Caller (signer):", signerAddress);
    console.log("From (token owner):", from);
    console.log("To (recipient):", to);
    console.log("Amount (raw):", amount);
    console.log("Amount type:", typeof amount);
    console.log("Amount (wei):", amountWei.toString());
    console.log("From balance:", fromBalance.toString());
    console.log("Current allowance from->caller:", currentAllowance.toString());
    console.log("==============================");

    const tx = await contract.transferFrom(from, to, amountWei);
    console.log("TransferFrom transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("TransferFrom executed successfully:", receipt.hash);

    return receipt;
  } catch (error) {
    console.error("Error executing transferFrom:", error);
    throw error;
  }
}
