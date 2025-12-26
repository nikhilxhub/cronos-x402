import { ethers } from "ethers";

export const getProvider = () => {
    return new ethers.JsonRpcProvider(
        process.env.CRONOS_RPC_URL || "https://evm-t3.cronos.org",
        undefined,
        { staticNetwork: true }
    );
};
