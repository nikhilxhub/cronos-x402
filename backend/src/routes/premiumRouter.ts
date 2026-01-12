import { Router, type Request, type Response } from "express";
import { validatePremiumBody } from "../middleware/requestValidation.js";
import { findApiKeyToModel2 } from "../db/config.js";
import { callModel_Api } from "../services/aiService.js";
import { verifyAndSendSignedTransaction } from "../services/verifyAndSendSignedTransaction.js";

export const premiumRouter: Router = Router();

premiumRouter.post(
  "/",
  validatePremiumBody,
  async (req: Request, res: Response) => {
    try {
      const { model, prompt } = req.body;

      if (!prompt) {
        return res.status(404).json({
          error: "prompt required",
        });
      }

      // bring api-key

      const apiKeyEntry = await findApiKeyToModel2(model);

      if (!apiKeyEntry) {
        return res.status(404).json({ error: "model/api key not found" });
      }

      const receiver = apiKeyEntry.owner_cronos;
      const rateWei = apiKeyEntry.rate_per_request;
      const aiModel = apiKeyEntry.ai_model;
      const api_key = apiKeyEntry.api_key;

      // check for signed transaction header
      const paymentProof = (req.headers["x402-signed-tx"] as string) || null;

      if (!paymentProof) {
        // create payment request....
        return res.status(202).json({
          message: "X402 Payment Required",
          paymentContext: {
            receiver,
            amountWei: rateWei.toString(),
            chainId: 338, // Cronos Testnet (zKEVM) or 25 for Mainnet - adjust as needed
            method: "transfer",
            token: "CRO",
            description: `Payment for AI model ${model}`
          }
        });
      }

      //   or else verify payment proof
      // verify and send transaction..

      const verifyResult = await verifyAndSendSignedTransaction({
        paymentProof,
        receiver,
        rateWei: rateWei.toString(),
      });

      if (!verifyResult.success) {
        return res
          .status(400)
          .json({
            error: "payment verification failed",
            details: verifyResult.reason,
          });
      }


      // Payment successful on-chain — now call the LLM via vercel ai
      console.log("sending call to model...");

      const aiResponse = await callModel_Api({
        model: aiModel,
        prompt,
        api_key

      });

      // Log / store usage if desired (omitted for brevity)

      return res.json({
        paidTxSignature: paymentProof,
        ai: aiResponse,
      });


    } catch (err) {
      console.error("premiumHandler error", err);
      return res
        .status(500)
        .json({ error: "internal_error", details: (err as any).message });
    }
  }
);
