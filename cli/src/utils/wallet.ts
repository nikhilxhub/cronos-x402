import { ethers } from "ethers";
import { log } from "./logger.js";

// Cronos EVM Testnet Configuration (Official x402 Support)
export const CRONOS_TESTNET = {
  name: "Cronos EVM Testnet",
  chainId: 338,
  rpcUrl: "https://evm-t3.cronos.org",
  currency: "TCRO",
  explorer: "https://explorer.cronos.org/testnet"
};

export interface WalletInfo {
  wallet: ethers.Wallet;
  provider: ethers.JsonRpcProvider;
  address: string;
}

/**
 * Initialize wallet from private key
 */
export function initWallet(privateKey: string): WalletInfo {
  const provider = new ethers.JsonRpcProvider(
    CRONOS_TESTNET.rpcUrl,
    {
      name: CRONOS_TESTNET.name,
      chainId: CRONOS_TESTNET.chainId
    },
    { staticNetwork: true }
  );

  const wallet = new ethers.Wallet(privateKey, provider);

  return {
    wallet,
    provider,
    address: wallet.address
  };
}

/**
 * Get wallet balance in TCRO
 */
export async function getBalance(walletInfo: WalletInfo): Promise<string> {
  const balance = await walletInfo.provider.getBalance(walletInfo.address);
  return ethers.formatEther(balance);
}

/**
 * Send payment transaction to the server wallet
 */
export async function sendPayment(
  walletInfo: WalletInfo,
  toAddress: string,
  amountTCRO: number
): Promise<ethers.TransactionResponse> {
  const amountWei = ethers.parseEther(amountTCRO.toString());

  // Get current fee data for zkEVM
  const feeData = await walletInfo.provider.getFeeData();

  // Build transaction - let provider estimate gas for zkEVM compatibility
  const txRequest: ethers.TransactionRequest = {
    to: toAddress,
    value: amountWei,
    // zkEVM requires higher gas limit than standard 21000
    gasLimit: 300000n,
  };

  // Use EIP-1559 if supported, otherwise legacy gas price
  if (feeData.maxFeePerGas) {
    txRequest.maxFeePerGas = feeData.maxFeePerGas;
    txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
  } else if (feeData.gasPrice) {
    txRequest.gasPrice = feeData.gasPrice;
  }

  const tx = await walletInfo.wallet.sendTransaction(txRequest);

  return tx;
}

/**
 * Wait for transaction confirmation
 */
export async function waitForConfirmation(
  tx: ethers.TransactionResponse,
  confirmations: number = 1
): Promise<ethers.TransactionReceipt | null> {
  return tx.wait(confirmations);
}

/**
 * Format address for display (truncated)
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Validate private key format
 */
export function isValidPrivateKey(key: string): boolean {
  try {
    // Remove 0x prefix if present
    const cleanKey = key.startsWith("0x") ? key.slice(2) : key;
    // Check if it's a valid 64 character hex string
    if (cleanKey.length !== 64) return false;
    if (!/^[0-9a-fA-F]+$/.test(cleanKey)) return false;
    // Try to create a wallet (will throw if invalid)
    new ethers.Wallet(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if balance is sufficient for a transaction
 */
export async function hasSufficientBalance(
  walletInfo: WalletInfo,
  amountTCRO: number
): Promise<boolean> {
  const balance = await walletInfo.provider.getBalance(walletInfo.address);
  const required = ethers.parseEther(amountTCRO.toString());
  // Add buffer for gas
  const gasBuffer = ethers.parseEther("0.01");
  return balance >= (required + gasBuffer);
}
