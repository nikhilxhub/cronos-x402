// CronosMindsPayment Contract Configuration

// Contract ABI (minimal for event verification)
export const CRONOS_MINDS_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": true, "name": "model", "type": "string" },
      { "indexed": false, "name": "amount", "type": "uint256" },
      { "indexed": false, "name": "timestamp", "type": "uint256" },
      { "indexed": false, "name": "userTotalPrompts", "type": "uint256" }
    ],
    "name": "PromptPaid",
    "type": "event"
  },
  {
    "inputs": [{ "name": "model", "type": "string" }],
    "name": "getModelPrice",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// PromptPaid event signature: keccak256("PromptPaid(address,string,uint256,uint256,uint256)")
export const PROMPT_PAID_EVENT_TOPIC = "0x" + "PromptPaid(address,string,uint256,uint256,uint256)";

export function getContractAddress(): string {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("CONTRACT_ADDRESS not configured in environment");
  }
  return address;
}
