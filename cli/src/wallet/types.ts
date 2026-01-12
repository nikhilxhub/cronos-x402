/**
 * Structure for storing wallet data on disk
 */
export interface StoredWallet {
  /** Private key encoded in base64 */
  privateKeyBase64: string;
  /** Public address (0x...) */
  address: string;
  /** Creation timestamp */
  createdAt: string;
  /** Network the wallet was created for */
  network: string;
}

/**
 * Wallet info returned after loading/creating
 */
export interface WalletData {
  privateKey: string;
  address: string;
}
