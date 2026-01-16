import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import boxen from "boxen";

import { showBanner } from "./utils/showBanner2.js";
import { log } from "./utils/logger.js";
import { getConfig } from "./utils/config.js";
import {
  initWallet,
  getBalance,
  sendPayment,
  waitForConfirmation,
  formatAddress,
  hasSufficientBalance,
  CRONOS_TESTNET,
  type WalletInfo
} from "./utils/wallet.js";
import { sendChatRequest, checkServerHealth } from "./utils/api.js";
import {
  hasWallet,
  createWallet,
  importWalletFromString,
  loadWallet,
  getWalletPath,
  type WalletData
} from "./wallet/index.js";

// Model definitions with pricing (must match backend/src/config/pricing.ts)
const MODELS = [
  // OpenAI - Temporarily disabled due to quota limits
  // { name: "GPT-3.5 Turbo", value: "gpt-4o", costTCRO: 0.5, description: "OpenAI's reliable model" },
  // { name: "GPT-3.5 Turbo", value: "gpt-4o-mini", costTCRO: 0.15, description: "Fast & affordable OpenAI" },
  // Google
  { name: "Gemini 2.5 Flash", value: "gemini-2.5-flash", costTCRO: 0.2, description: "Google's fast model" },
  { name: "Gemini 2.5 Pro", value: "gemini-2.5-pro", costTCRO: 0.5, description: "Google's most capable model" },
  { name: "Gemini 2.0 Flash", value: "gemini-2.0-flash", costTCRO: 0.15, description: "Google's next-gen flash model" },
  // Groq
  { name: "Llama 3.3 70B", value: "groq", costTCRO: 0.1, description: "Ultra-fast via Groq" }
];

// Current selected model (default to cheapest)
let currentModel = MODELS[3]!; // Groq by default

function showHelp() {
  console.log(
    boxen(
      chalk.bold.cyan("CronosMinds Commands\n\n") +
      chalk.yellow("/help") + "            Show this help message\n" +
      chalk.yellow("/balance") + "         Check wallet balance\n" +
      chalk.yellow("/address") + "         Show wallet address\n" +
      chalk.yellow("/model") + "           Change AI model\n" +
      chalk.yellow("/models") + "          List available models & pricing\n" +
      chalk.yellow("/wallet") + "          Show wallet file location\n" +
      chalk.yellow("/clear") + "           Clear the screen\n" +
      chalk.yellow("/exit") + "            Quit the application\n\n" +
      chalk.gray("Just type your question to chat with AI!"),
      {
        padding: 1,
        borderStyle: "round",
        borderColor: "cyan",
        title: "Help",
        titleAlignment: "center"
      }
    )
  );
}

function showModels() {
  console.log("\n" + chalk.bold("Available Models:\n"));
  MODELS.forEach((model, idx) => {
    const isCurrent = model.value === currentModel.value;
    const prefix = isCurrent ? chalk.green("→ ") : "  ";
    const suffix = isCurrent ? chalk.green(" (current)") : "";
    console.log(
      prefix +
      chalk.cyan(`${model.name}`) +
      chalk.yellow(` (${model.costTCRO} TCRO)`) +
      chalk.gray(` - ${model.description}`) +
      suffix
    );
  });
  console.log("");
}

async function selectModel(): Promise<void> {
  const { model } = await inquirer.prompt([
    {
      type: "list",
      name: "model",
      message: "Select AI Model:",
      choices: MODELS.map((m) => ({
        name: `${m.name} (${m.costTCRO} TCRO) - ${m.description}`,
        value: m.value
      })),
      default: currentModel.value
    }
  ]);

  currentModel = MODELS.find((m) => m.value === model)!;
  log.ok(`Model changed to ${currentModel.name}`);
}

async function displayWalletInfo(walletInfo: WalletInfo) {
  const balance = await getBalance(walletInfo);
  const balanceNum = parseFloat(balance);

  console.log(
    boxen(
      chalk.gray("Address: ") + chalk.cyan(walletInfo.address) + "\n" +
      chalk.gray("Balance: ") +
      (balanceNum > 0
        ? chalk.green(`${balance} TCRO`)
        : chalk.red(`${balance} TCRO`)) +
      "\n" +
      chalk.gray("Network: ") + chalk.blue(CRONOS_TESTNET.name) + "\n" +
      chalk.gray("Model:   ") + chalk.yellow(`${currentModel.name} (${currentModel.costTCRO} TCRO/prompt)`),
      {
        padding: 1,
        borderStyle: "round",
        borderColor: balanceNum > 0 ? "green" : "red",
        title: "Wallet",
        titleAlignment: "center"
      }
    )
  );

  if (balanceNum === 0) {
    log.warn("Balance is 0. Get testnet TCRO from the Cronos EVM faucet.");
  }

  console.log(chalk.gray("Type /help for commands or just ask a question!\n"));
}

async function setupWallet(): Promise<WalletData> {
  console.log(
    boxen(
      chalk.bold("Welcome to CronosMinds!\n\n") +
      chalk.gray("Let's set up your wallet to get started."),
      {
        padding: 1,
        borderStyle: "round",
        borderColor: "cyan",
        title: "First Time Setup",
        titleAlignment: "center"
      }
    )
  );

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "How would you like to set up your wallet?",
      choices: [
        { name: "Create a new wallet", value: "create" },
        { name: "Import existing wallet (private key)", value: "import" }
      ]
    }
  ]);

  if (action === "create") {
    const spinner = ora("Generating new wallet...").start();
    const walletData = createWallet();
    spinner.succeed("Wallet created!");

    console.log(
      boxen(
        chalk.green("Address: ") + chalk.cyan(walletData.address) + "\n\n" +
        chalk.yellow("Saved to: ") + chalk.gray(getWalletPath()) + "\n\n" +
        chalk.red.bold("⚠ BACKUP YOUR WALLET FILE!"),
        { padding: 1, borderStyle: "round", borderColor: "green" }
      )
    );

    await inquirer.prompt([
      { type: "confirm", name: "ok", message: "I've backed up my wallet", default: false }
    ]);

    return walletData;
  } else {
    const { privateKey } = await inquirer.prompt([
      {
        type: "password",
        name: "privateKey",
        message: "Private Key:",
        mask: "*",
        validate: (input) => {
          const cleaned = input.trim().replace(/^0x/, "");
          if (cleaned.length !== 64 || !/^[0-9a-fA-F]+$/.test(cleaned)) {
            return "Invalid private key (must be 64 hex characters)";
          }
          return true;
        }
      }
    ]);

    const spinner = ora("Importing wallet...").start();
    const walletData = importWalletFromString(privateKey);
    spinner.succeed(`Wallet imported: ${formatAddress(walletData.address)}`);
    return walletData;
  }
}

async function processPrompt(
  prompt: string,
  walletInfo: WalletInfo,
  contractAddress: string
): Promise<void> {
  // Check balance
  const hasBalance = await hasSufficientBalance(walletInfo, currentModel.costTCRO);
  if (!hasBalance) {
    const bal = await getBalance(walletInfo);
    log.err(`Insufficient balance. Need ${currentModel.costTCRO} TCRO, have ${bal} TCRO`);
    return;
  }

  // Show cost and confirm
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Send ${currentModel.costTCRO} TCRO to use ${currentModel.name}?`,
      default: true
    }
  ]);

  if (!confirm) {
    log.info("Cancelled");
    return;
  }

  // Process payment via smart contract
  const paymentSpinner = ora("Processing payment via smart contract...").start();

  try {
    const tx = await sendPayment(walletInfo, contractAddress, currentModel.costTCRO, currentModel.value);
    paymentSpinner.text = `Waiting for confirmation... ${formatAddress(tx.hash)}`;

    const receipt = await waitForConfirmation(tx);
    if (!receipt || receipt.status !== 1) {
      paymentSpinner.fail("Transaction failed");
      return;
    }

    paymentSpinner.succeed(`Paid! TX: ${formatAddress(tx.hash)}`);

    // Get AI response
    const aiSpinner = ora(`Asking ${currentModel.name}...`).start();

    try {
      const response = await sendChatRequest(
        { prompt, model: currentModel.value },
        tx.hash
      );

      aiSpinner.stop();

      // Display response
      console.log(
        boxen(response.response, {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          title: currentModel.name,
          titleAlignment: "center"
        })
      );

      console.log(chalk.gray(`TX: ${tx.hash}\n`));
    } catch (apiErr: any) {
      aiSpinner.fail("Failed to get AI response");
      log.err(apiErr.message);
    }
  } catch (err: any) {
    paymentSpinner.fail("Payment failed");
    log.err(err.message);
  }
}

export async function runCli() {
  // Show banner
  showBanner();

  // Setup or load wallet
  let walletData: WalletData;

  if (!hasWallet()) {
    walletData = await setupWallet();
  } else {
    const loadSpinner = ora("Loading wallet...").start();
    const loaded = loadWallet();

    if (!loaded) {
      loadSpinner.fail("Failed to load wallet");
      walletData = await setupWallet();
    } else {
      loadSpinner.succeed(`Wallet: ${formatAddress(loaded.address)}`);
      walletData = loaded;
    }
  }

  // Get config
  const config = getConfig();
  if (!config.contractAddress) {
    log.err("CONTRACT_ADDRESS not set in .env");
    process.exit(1);
  }

  // Check server
  const serverSpinner = ora("Connecting to server...").start();
  if (!(await checkServerHealth())) {
    serverSpinner.fail("Cannot connect to server");
    log.warn(`Make sure server is running at ${config.apiUrl}`);
    process.exit(1);
  }
  serverSpinner.succeed("Connected to server");

  // Initialize ethers wallet
  const walletInfo = initWallet(walletData.privateKey);

  // Show wallet info
  await displayWalletInfo(walletInfo);

  // Main loop
  while (true) {
    const { input } = await inquirer.prompt([
      {
        type: "input",
        name: "input",
        message: chalk.cyan("›"),
        prefix: ""
      }
    ]);

    const trimmed = input.trim();
    if (!trimmed) continue;

    // Handle commands
    if (trimmed.startsWith("/")) {
      const cmd = trimmed.toLowerCase();

      switch (cmd) {
        case "/help":
        case "/?":
          showHelp();
          break;

        case "/balance":
          const bal = await getBalance(walletInfo);
          log.info(`Balance: ${bal} TCRO`);
          break;

        case "/address":
        case "/pub":
        case "/pubkey":
          log.info(`Address: ${walletInfo.address}`);
          break;

        case "/model":
          await selectModel();
          break;

        case "/models":
          showModels();
          break;

        case "/wallet":
          log.info(`Wallet: ${getWalletPath()}`);
          break;

        case "/clear":
        case "/cls":
          console.clear();
          showBanner();
          await displayWalletInfo(walletInfo);
          break;

        case "/exit":
        case "/quit":
        case "/q":
          log.ok("Goodbye!");
          process.exit(0);

        default:
          log.warn(`Unknown command: ${cmd}. Type /help for commands.`);
      }
    } else {
      // Process as AI prompt
      await processPrompt(trimmed, walletInfo, config.contractAddress);
    }
  }
}
