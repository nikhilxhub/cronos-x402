import chalk from "chalk";
import boxen from "boxen";
// Remove the figlet import

export function showBanner2() {
   console.log(
      chalk.bold.hex('#CD6F47')(`

 █████   ██████  ███████ ███    ██ ████████ ██   ██ ██   ██  ██████  ██████  
██   ██ ██       ██      ████   ██    ██     ██ ██  ██   ██ ██  ████      ██ 
███████ ██   ███ █████   ██ ██  ██    ██      ███   ███████ ██ ██ ██  █████  
██   ██ ██    ██ ██      ██  ██ ██    ██     ██ ██       ██ ████  ██ ██      
██   ██  ██████  ███████ ██   ████    ██    ██   ██      ██  ██████  ███████ 
                                                                        
`)
    );
    console.log(
      chalk.gray('AI-powered coding assistant with MCP tool support')
    );
    console.log(chalk.gray("Type your questions or '/exit' to quit\n"));
}

  