import type { Request, Response, NextFunction } from "express";
import { ethers } from "ethers";
import { getProvider } from "../config/provider.js";
import { MODEL_PRICING } from "../config/pricing.js";
import { CRONOS_MINDS_ABI, getContractAddress } from "../config/contract.js";
import { keccak256, toUtf8Bytes } from "ethers";

// Replay Protection: In-memory Set to store used transaction hashes
const usedTxSet: Set<string> = new Set();

export interface PaymentVerifiedRequest extends Request {
  paymentTxHash?: string;
  paymentAmount?: bigint;
  payerAddress?: string;
}

// Interface for decoded PromptPaid event
interface PromptPaidEvent {
  user: string;
  model: string;
  amount: bigint;
  timestamp: bigint;
  userTotalPrompts: bigint;
}

export async function paymentMiddleware(
  req: PaymentVerifiedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const txHash = req.headers["x-payment-hash"] as string;
    const { model } = req.body;

    // Check 1: Existence - Payment hash must be present
    if (!txHash) {
      return res.status(402).json({
        error: "Payment Required",
        message: "Missing x-payment-hash header. Please pay via smart contract before making a request.",
        paymentInfo: {
          contract: process.env.CONTRACT_ADDRESS,
          models: MODEL_PRICING,
          chainId: 338,
          network: "Cronos EVM Testnet",
          rpcUrl: "https://evm-t3.cronos.org"
        }
      });
    }

    // Normalize hash
    const normalizedHash = txHash.toLowerCase();

    // Check 2: Replay Protection - Has this hash been used before?
    if (usedTxSet.has(normalizedHash)) {
      return res.status(403).json({
        error: "Duplicate Transaction",
        message: "This transaction hash has already been used. Each prompt requires a new payment."
      });
    }

    // Check 3: On-Chain Verification
    const provider = getProvider();
    let contractAddress: string;

    try {
      contractAddress = getContractAddress();
    } catch (err) {
      console.error("CONTRACT_ADDRESS not configured");
      return res.status(500).json({
        error: "Server Configuration Error",
        message: "Payment contract not configured on server."
      });
    }

    // Fetch the transaction
    const tx = await provider.getTransaction(normalizedHash);
    if (!tx) {
      return res.status(400).json({
        error: "Transaction Not Found",
        message: "The provided transaction hash was not found on-chain. Please wait for the transaction to be mined."
      });
    }

    // Wait for transaction to be mined if pending
    const receipt = await provider.getTransactionReceipt(normalizedHash);
    if (!receipt) {
      return res.status(400).json({
        error: "Transaction Pending",
        message: "Transaction is still pending. Please wait for confirmation."
      });
    }

    // Check transaction was successful
    if (receipt.status !== 1) {
      return res.status(400).json({
        error: "Transaction Failed",
        message: "The payment transaction failed on-chain."
      });
    }

    // Verify transaction was sent to our contract
    if (tx.to?.toLowerCase() !== contractAddress.toLowerCase()) {
      return res.status(400).json({
        error: "Invalid Contract",
        message: `Payment was sent to wrong address. Expected contract: ${contractAddress}, Got: ${tx.to}`
      });
    }

    // Check 4: Verify PromptPaid event was emitted
    const contractInterface = new ethers.Interface(CRONOS_MINDS_ABI);

    // Find the PromptPaid event in the logs
    let promptPaidEvent: PromptPaidEvent | null = null;

    for (const log of receipt.logs) {
      try {
        // Check if this log is from our contract
        if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
          continue;
        }

        console.log("Processing log from contract, topics:", log.topics);
        
        const parsed = contractInterface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });
        
        console.log("Parsed log name:", parsed?.name);

        if (parsed && parsed.name === "PromptPaid") {
          // Extract model hash from Indexed object
          // Indexed strings are stored as keccak256 hashes in Solidity events
          let modelHash: string;
          const modelArg = parsed.args[1];
          
          if (modelArg && typeof modelArg === 'object' && 'hash' in modelArg) {
            // It's an Indexed object, extract the hash
            modelHash = String(modelArg.hash);
          } else if (typeof modelArg === 'string') {
            // Already a string (shouldn't happen for indexed, but handle it)
            modelHash = modelArg;
          } else {
            // Fallback
            modelHash = String(modelArg || '');
          }
          
          promptPaidEvent = {
            user: String(parsed.args[0]),
            model: modelHash, // Store the hash for comparison
            amount: parsed.args[2],
            timestamp: parsed.args[3],
            userTotalPrompts: parsed.args[4]
          };
          break;
        }
      } catch {
        // Not the event we're looking for, continue
        continue;
      }
    }

    if (!promptPaidEvent) {
      return res.status(400).json({
        error: "Invalid Payment Transaction",
        message: "Transaction does not contain a valid PromptPaid event from our contract."
      });
    }

    // Check 5: Verify the model in the event matches the requested model
    // Since indexed strings are stored as keccak256 hashes, we need to hash the requested model
    // and compare it with the hash from the event
    const requestedModelHash = keccak256(toUtf8Bytes(model));
    if (promptPaidEvent.model.toLowerCase() !== requestedModelHash.toLowerCase()) {
      return res.status(400).json({
        error: "Model Mismatch",
        message: `Payment was for a different model. Expected hash for "${model}" but got "${promptPaidEvent.model}".`
      });
    }

    // Check 6: Verify payment amount matches or exceeds model cost
    const modelPricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
    if (!modelPricing) {
      return res.status(400).json({
        error: "Invalid Model",
        message: `Unknown model: ${model}. Available models: ${Object.keys(MODEL_PRICING).join(", ")}`
      });
    }

    const requiredAmount = ethers.parseEther(modelPricing.costTCRO.toString());
    if (promptPaidEvent.amount < requiredAmount) {
      return res.status(400).json({
        error: "Insufficient Payment",
        message: `Payment amount too low. Required: ${modelPricing.costTCRO} TCRO, Received: ${ethers.formatEther(promptPaidEvent.amount)} TCRO`
      });
    }

    // All checks passed - Add hash to used set (Replay Protection)
    usedTxSet.add(normalizedHash);

    // Attach payment info to request for downstream use
    req.paymentTxHash = normalizedHash;
    req.paymentAmount = promptPaidEvent.amount;
    req.payerAddress = promptPaidEvent.user;

    console.log(`Payment verified via contract: ${normalizedHash}`);
    console.log(`  User: ${promptPaidEvent.user}`);
    console.log(`  Model: ${promptPaidEvent.model}`);
    console.log(`  Amount: ${ethers.formatEther(promptPaidEvent.amount)} TCRO`);
    console.log(`  User Total Prompts: ${promptPaidEvent.userTotalPrompts}`);

    next();
  } catch (err: any) {
    console.error("Payment middleware error:", err);
    return res.status(500).json({
      error: "Payment Verification Error",
      message: err.message || "Failed to verify payment"
    });
  }
}

// Export for testing/monitoring purposes
export function getUsedTransactionCount(): number {
  return usedTxSet.size;
}

export function isTransactionUsed(txHash: string): boolean {
  return usedTxSet.has(txHash.toLowerCase());
}
