import { APIGatewayEvent, Context,APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';
import {OpenAI} from 'openai';
import {getRoman} from 'cantonese-romanisation';
var pinyin = require("node-pinyin");

const secretsManager = new AWS.SecretsManager();

async function keyRetrieval(): Promise<string> {
    const secretName = "openAIAccess";
    const secret = await secretsManager.getSecretValue({SecretId: secretName}).promise();
    if (!secret.SecretString) {
        throw new Error(`Secret ${secretName} is not a string`);
    }
    const openAIAccess = JSON.parse(secret.SecretString);
    console.log("Retrieved OpenAI API key from Secrets Manager");
    return openAIAccess[secretName];
}

function generatePinyin(name: string): { mainlandPinyin: string, hkPinyin: string[] } {
    const chinesePart = name.replace(/[^\u4e00-\u9fa5]/g, '');
    console.log("chinesePart", chinesePart)
    const mainlandPinyin = pinyin(chinesePart, { style: 'normal',mode: "surname", }).join(' ');
    const hkPinyin = getRoman(chinesePart).map(roman => roman.join(': '));
    console.log(mainlandPinyin, hkPinyin)
    return { mainlandPinyin, hkPinyin };
}


async function enhanceNameInfo(openaiClient: OpenAI, name: string): Promise<string> {
    const { mainlandPinyin, hkPinyin } = generatePinyin(name);
    const prompt = `
        You are a helpful assistant. Given the following name, provide a brief description of the person's possible characteristics like race, gender, age, appearance, economic situation, or tags. Here's the name:
        "${name}"
    
        Provide the response in the following JSON format:
        {
            "name": "${name}",
            "mainland_pinyin": "${mainlandPinyin}",
            "hk_pinyin": ${JSON.stringify(hkPinyin)},
            "tags": ["<tag1>", "<tag2>", ...]
        }
    `;
    console.log(prompt)
    const response = await openaiClient.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: "system", content: prompt }],
        max_tokens: 4096,
        temperature: 0.7
    });
    if (response.choices[0].message.content === null) {
        throw new Error("No response from OpenAI");
    }
    console.log("response", response.choices[0].message)
    return response.choices[0].message.content;
}

export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    try {
        const openAIKey = await keyRetrieval();
        const openaiClient = new OpenAI({ apiKey: openAIKey });
        console.log("event", event)
        const body = event.body ? JSON.parse(event.body) : null;
        const inputName = body.input_query;
        const nameList = [
            "David Smith 大卫 斯密斯",
            "Yueling Zhang 月林张",
            "Huawen Wu 华文吴",
            "Annie Lee 李安妮"
        ];
        // Enhance name info
        const enhancedNameInfoPromises = nameList.map(name => enhanceNameInfo(openaiClient, name));
        const enhancedNameInfo = await Promise.all(enhancedNameInfoPromises);

        // Generate matching prompt
        const delimiter = "####";
        const systemMessage = `
            You are a helpful assistant. 
            Given a list of enhanced name information and a user input, you need to find the most relevant name. 
            The input could be in English, Chinese, Mainland Pinyin, HK Pinyin, or a description.
            Here is the list of names and their enhanced information:
            ${delimiter} ${enhancedNameInfo.join(` ${delimiter} `)} ${delimiter}
    
            User Input: "${inputName}"
    
            Match the input to the most relevant name from the list.
            Respond with the most relevant name and provide the name with its original form, Even if a suitable name cannot be found. with no any description and other character, here is name: <name>. 
            And provide the reasons why you think this name is the most relevant, here is reasons: ["<reason1>", "<reason2>", ...]
            Provide the response in the following JSON format:
            {
                "name": "<name>",
                "reasons": ["<reason1>", "<reason2>", ...]
            }
        `;
        console.log(systemMessage)
        const response = await openaiClient.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [{ role: "system", content: systemMessage }],
            max_tokens: 4096,
            temperature: 0
        });

        const match = response.choices[0].message.content
        console.log("match", match)
        return {
            statusCode: 200,
            body: match ? match : JSON.stringify({ error: "No match found" })
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error instanceof Error ? error.message : "An unknown error occurred" })
        };
    }

}
