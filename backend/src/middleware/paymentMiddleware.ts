import type { Request, Response, NextFunction } from "express";
import { ethers } from "ethers";
import { getProvider } from "../config/provider.js";
import { MODEL_PRICING } from "../config/pricing.js";

// Replay Protection: In-memory Set to store used transaction hashes
const usedTxSet: Set<string> = new Set();

export interface PaymentVerifiedRequest extends Request {
  paymentTxHash?: string;
  paymentAmount?: bigint;
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
        message: "Missing x-payment-hash header. Please pay before making a request.",
        paymentInfo: {
          receiver: process.env.SERVER_WALLET_ADDRESS,
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

    // Verify receiver address matches SERVER_WALLET_ADDRESS
    const serverWallet = process.env.SERVER_WALLET_ADDRESS;
    if (!serverWallet) {
      console.error("SERVER_WALLET_ADDRESS not configured");
      return res.status(500).json({
        error: "Server Configuration Error",
        message: "Payment receiver not configured on server."
      });
    }

    if (tx.to?.toLowerCase() !== serverWallet.toLowerCase()) {
      return res.status(400).json({
        error: "Invalid Receiver",
        message: `Payment was sent to wrong address. Expected: ${serverWallet}, Got: ${tx.to}`
      });
    }

    // Verify payment amount matches or exceeds model cost
    const modelPricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
    if (!modelPricing) {
      return res.status(400).json({
        error: "Invalid Model",
        message: `Unknown model: ${model}. Available models: ${Object.keys(MODEL_PRICING).join(", ")}`
      });
    }

    const requiredAmount = ethers.parseEther(modelPricing.costTCRO.toString());
    if (tx.value < requiredAmount) {
      return res.status(400).json({
        error: "Insufficient Payment",
        message: `Payment amount too low. Required: ${modelPricing.costTCRO} TCRO, Received: ${ethers.formatEther(tx.value)} TCRO`
      });
    }

    // All checks passed - Add hash to used set (Replay Protection)
    usedTxSet.add(normalizedHash);

    // Attach payment info to request for downstream use
    req.paymentTxHash = normalizedHash;
    req.paymentAmount = tx.value;

    console.log(`Payment verified: ${normalizedHash} - ${ethers.formatEther(tx.value)} TCRO for model: ${model}`);

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
