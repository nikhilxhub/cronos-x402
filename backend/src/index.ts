import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { premiumRouter } from "./routes/premiumRouter.js";
import { chatRouter } from "./routes/chatRouter.js";
import cors from "cors";
import { MODEL_PRICING } from "./config/pricing.js";

const app = express();
app.use(cors());
app.use(express.json());

// Legacy premium router (existing flow with signed tx)
app.use("/premium", premiumRouter);

// New chat router (pre-paid flow with tx hash verification)
app.use("/chat", chatRouter);

// Health check endpoint
app.get("/health", (_req, res) => res.json({ ok: true }));

// Info endpoint - shows available models and pricing
app.get("/info", (_req, res) => {
  res.json({
    name: "CronosMinds",
    description: "Pay-Per-Prompt AI API on Cronos zkEVM",
    network: {
      name: "Cronos zkEVM Testnet",
      chainId: 240,
      rpcUrl: "https://rpc-testnet.zkevm.cronos.org",
      currency: "TCRO"
    },
    serverWallet: process.env.SERVER_WALLET_ADDRESS,
    models: MODEL_PRICING
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    CronosMinds Server                     ║
╠═══════════════════════════════════════════════════════════╣
║  Status: Running on port ${PORT}                            ║
║  Network: Cronos EVM Testnet (Chain ID: 338)              ║
║  RPC: https://evm-t3.cronos.org                           ║
║  Endpoints:                                               ║
║    POST /chat   - AI chat with payment verification       ║
║    GET  /info   - API information and pricing             ║
║    GET  /health - Health check                            ║
╚═══════════════════════════════════════════════════════════╝
  `);
});