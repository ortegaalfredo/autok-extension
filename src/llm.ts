
import Neuroengine from './neuroengine.js';
import * as vscode from 'vscode';

/**
 * Asynchronously calls the OpenAI API to generate a response based on the given prompt.
 *
 * @param {string} prompt - The input prompt for the AI model.
 * @param {string} apiKey - The API key for authentication.
 * @param {string} endpoint - The API endpoint URL.
 * @param {string} modelName - The name of the AI model to use.
 * @returns {Promise<string | null>} - A promise that resolves to the AI-generated response or null if an error occurs.
 */

async function callOpenAI(prompt: string,apiKey: string,endpoint:string,modelName:string): Promise<string | null> {

    const params = {
        model: modelName,
        messages: [
            {
                role: "system",
                content: "You are an expert coder and bug-hunter assistant."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        max_tokens: 1000,
        temperature: 0.0,
    };
    

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }


        const data: unknown = await response.json();

        const content = (data as any).choices[0].message.content;

        return content;
    } catch (error) {
        console.error('Error:', error);
    }
    return null;
}

/**
 * Asynchronously retrieves a response from a language model based on the given prompt.
 *
 * @param {string} prompt - The input prompt for the language model.
 * @param {string} jsonbegin - The JSON string to prepend to the response.
 * @returns {Promise<string | null>} - A promise that resolves to the language model's response or null if an error occurs.
 */

async function getLLMResponse(prompt: string, jsonbegin: string): Promise<string | null> {
    let neuroengine: Neuroengine;
    const config = vscode.workspace.getConfiguration('autokaker');
    try {
        const endpoint = config.get<string>('Service', 'Neuroengine.ai');
        const customendpoint = config.get<string>('CustomEndpoint', '');
        const modelname = config.get<string>('ModelName', 'gpt-4o');
        const apikey = config.get<string>('apikey', '');
        if (endpoint.includes('Neuroengine.ai')) // Neuroengine is not an OpenAI-style API
            {
            neuroengine = new Neuroengine("Neuroengine-Vuln", {
              server_address: 'api.neuroengine.ai',
              server_port: 443,
              key: '000',
              verify_ssl: true
              });
            const response: string | null = await neuroengine.request(prompt + jsonbegin, {
                temperature: 0.0,
                max_new_len: 1000,
                raw: true
                });
            if (response === null) {
                return "";}
            return response;
            }
        else {
            let ep:string = 'https://api.openai.com/v1/chat/completions';

            if(endpoint.includes("Custom")) {
                ep = customendpoint;
                }
            const response: string | null = await callOpenAI(prompt,apikey,ep,modelname);
            if (response === null) {
                return "";
                }
            return jsonbegin+response;
            }
    } catch (error) {
        console.error('Error calling neuroengine.request:', error);
        return null;
    }
    return "";
}

export default getLLMResponse;