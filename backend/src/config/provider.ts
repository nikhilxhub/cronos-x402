import { ethers } from "ethers";

// Cronos EVM Testnet Configuration (Official x402 Support)
const CRONOS_EVM_TESTNET = {
  name: "Cronos EVM Testnet",
  chainId: 338,
  rpcUrl: "https://evm-t3.cronos.org",
  currency: "TCRO",
  explorer: "https://explorer.cronos.org/testnet"
};

export const getProvider = () => {
  return new ethers.JsonRpcProvider(
    process.env.CRONOS_RPC_URL || CRONOS_EVM_TESTNET.rpcUrl,
    {
      name: CRONOS_EVM_TESTNET.name,
      chainId: CRONOS_EVM_TESTNET.chainId
    },
    { staticNetwork: true }
  );
};

export { CRONOS_EVM_TESTNET };
