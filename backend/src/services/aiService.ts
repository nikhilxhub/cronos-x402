import { callGEMINI } from "../aiModels/gemini.js";
import { callGEMINI2 } from "../aiModels/gemini-2.js";
import { callGPT4 } from "../aiModels/gpt4.js";
import { callGROQ } from "../aiModels/groq.js";

export async function callModel_Api(opts:{

    model:string,
    prompt:string,
    api_key:string
}){
    
    const { model, prompt, api_key } = opts;
    
    switch(model){
        case "gpt-3.5-turbo":
            return await callGPT4(prompt, api_key);

        case "gemini-2.5-pro":
            return await callGEMINI(prompt, api_key);

        case "gemini-2":
            return await callGEMINI2(prompt, api_key);

        case "groq":
            return await callGROQ(prompt, api_key);

        default:
            throw new Error("Unsupported model...");
    }


    
}