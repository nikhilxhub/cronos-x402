import chalk from "chalk";
import boxen from "boxen";

export function showBanner() {
  console.log(
    chalk.bold.hex('#3B82F6')(`
 ██████ ██████   ██████  ███    ██  ██████  ███████ ███    ███ ██ ███    ██ ██████  ███████
██      ██   ██ ██    ██ ████   ██ ██    ██ ██      ████  ████ ██ ████   ██ ██   ██ ██
██      ██████  ██    ██ ██ ██  ██ ██    ██ ███████ ██ ████ ██ ██ ██ ██  ██ ██   ██ ███████
██      ██   ██ ██    ██ ██  ██ ██ ██    ██      ██ ██  ██  ██ ██ ██  ██ ██ ██   ██      ██
 ██████ ██   ██  ██████  ██   ████  ██████  ███████ ██      ██ ██ ██   ████ ██████  ███████
`)
  );

  console.log(
    boxen(
      chalk.cyan('Pay-Per-Prompt AI on Cronos EVM') + '\n' +
      chalk.gray('Access premium AI models with micro-transactions'),
      {
        padding: 1,
        margin: { top: 0, bottom: 1, left: 0, right: 0 },
        borderStyle: 'round',
        borderColor: 'blue'
      }
    )
  );
}

// Keep old export name for compatibility
export const showBanner2 = showBanner;

  