"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeminiLLM = getGeminiLLM;
const google_genai_1 = require("@langchain/google-genai");
function getGeminiLLM(apiKey) {
    return new google_genai_1.ChatGoogleGenerativeAI({
        apiKey,
        model: 'gemini-pro',
    });
}
