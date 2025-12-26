import dotenv from "dotenv";
dotenv.config();


export const ENV = {

    CRONOS_RPC_URL: process.env.CRONOS_RPC_URL || "https://evm-t3.cronos.org",

    


}