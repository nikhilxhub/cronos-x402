
import { showBanner2 } from "./utils/showBanner2.js";
import { log } from "./utils/logger.js";





function showHelp(){

    console.log(`
        Commands:
            :help               show this help
            :change_model       choose a different model
            :change_cluster     choose solana cluster
            :pub_key            show current wallet public key
            :exit               quit
        
        `)


}


export async function runCli() {
    showBanner2();





    log.ok("See you Again..!");

}
