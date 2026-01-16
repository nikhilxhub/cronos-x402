// CronosMindsPayment Contract ABI (minimal for payForPrompt function)
export const CRONOS_MINDS_ABI = [
  {
    "inputs": [{ "name": "model", "type": "string" }],
    "name": "payForPrompt",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "model", "type": "string" }],
    "name": "getModelPrice",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getUserStats",
    "outputs": [
      { "name": "", "type": "uint256" },
      { "name": "", "type": "uint256" },
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
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
  }
] as const;
