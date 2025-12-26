import { ethers } from "ethers";
import { getProvider } from "../config/provider.js";

interface VerifyParams {
    paymentProof: string; // The signed transaction hex
    receiver: string;
    rateWei: string | bigint;
}

interface VerifyResult {
    success: boolean;
    reason?: string;
    txHash?: string;
}

export async function verifyAndSendSignedTransaction({
    paymentProof,
    receiver,
    rateWei,
}: VerifyParams): Promise<VerifyResult> {
    try {
        const provider = getProvider();

        // 1. Decode the transaction
        const tx = ethers.Transaction.from(paymentProof);

        if (!tx.to || tx.to.toLowerCase() !== receiver.toLowerCase()) {
            return {
                success: false,
                reason: `Invalid receiver. Expected ${receiver}, got ${tx.to}`,
            };
        }

        if (tx.value < BigInt(rateWei)) {
            return {
                success: false,
                reason: `Insufficient payment. Expected ${rateWei} wei, got ${tx.value.toString()} wei`,
            };
        }

        // 2. Broadcast the transaction
        console.log("Broadcasting transaction to Cronos...");
        const txResult = await provider.broadcastTransaction(paymentProof);

        // Wait for at least 1 confirmation to ensure it's not a total bust (optional but safer)
        console.log("Waiting for confirmation...");
        await txResult.wait(1);

        // i think i should also check the balance of the user first..so transaction dont fail,just a check

        return {
            success: true,
            txHash: txResult.hash,
        };
    } catch (err: any) {
        console.error("Verification error:", err);
        return {
            success: false,
            reason: err.message || "Failed to decode/broadcast transaction",
        };
    }
}
