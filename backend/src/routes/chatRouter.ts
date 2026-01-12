import { Router } from "express";
import { validatePremiumBody } from "../middleware/requestValidation.js";
import { paymentMiddleware } from "../middleware/paymentMiddleware.js";
import { chatController } from "../controllers/chatController.js";

export const chatRouter: Router = Router();

// POST /chat - Main endpoint for AI chat
// Flow: Validate Body -> Verify Payment -> Process Chat
chatRouter.post(
  "/",
  validatePremiumBody,        // Validates { prompt, model } in body
  paymentMiddleware,          // Verifies x-payment-hash header & on-chain tx
  chatController              // Processes the AI request
);
