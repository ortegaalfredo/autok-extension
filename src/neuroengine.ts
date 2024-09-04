import * as https from 'https';
import * as http from 'http';

interface NeuroengineOptions {
    server_address?: string;
    server_port?: number;
    key?: string;
    verify_ssl?: boolean;
}

interface RequestOptions {
    temperature?: number;
    top_p?: number;
    min_p?: number;
    top_k?: number;
    repetition_penalty?: number;
    max_new_len?: number;
    seed?: number;
    raw?: boolean;
    tries?: number;
    gettokens?: number;
    streamkey?: string;
}

interface Response {
    errorcode: number;
    reply: string;
}

class Neuroengine {
    private server_address: string;
    private server_port: number;
    private service_name: string;
    private key: string;
    private verify_ssl: boolean;

    constructor(service_name: string, options: NeuroengineOptions = {}) {
        this.server_address = options.server_address || "api.neuroengine.ai";
        this.server_port = options.server_port || 443;
        this.service_name = service_name;
        this.key = options.key || "";
        this.verify_ssl = options.verify_ssl !== undefined ? options.verify_ssl : true;
    }

    async getModels(): Promise<any> {
        const command = { command: 'getmodels' };
        return this.send(command);
    }

    async request(prompt: string, options: RequestOptions = {}): Promise<string> {
        if (!prompt) {return "";}

        const command = {
            message: prompt,
            temperature: options.temperature || 1.0,
            top_p: options.top_p || 0.9,
            top_k: options.top_k || 40,
            min_p: options.min_p || 0.0,
            repetition_penalty: options.repetition_penalty || 1.2,
            max_new_len: options.max_new_len || 128,
            seed: options.seed || 0,
            raw: options.raw ? 'true' : 'false',
            key: options.streamkey || "",
            gettokens: options.gettokens || 20
        };

        try {
            let count = 0;
            const tries = options.tries || 5;
            let response: Response;

            while (count < tries) {
                count++;
                response = await this.send(command);
                if (response.errorcode === 0) {break;}
            }

            return response!.reply;
        } catch (e) {
            return `Connection error. Try in a few seconds (${e})`;
        }
    }

    private send(command: any): Promise<Response> {
        return new Promise((resolve, reject) => {
            const jsonData = JSON.stringify(command);
            const options: https.RequestOptions = {
                hostname: this.server_address,
                port: this.server_port,
                path: `/${this.service_name}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(jsonData)
                },
                rejectUnauthorized: this.verify_ssl
            };

            const req = (this.verify_ssl ? https : http).request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Failed to parse response'));
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(jsonData);
            req.end();
        });
    }
}

export default Neuroengine;
