"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFile = analyzeFile;
// Code Parser (Regex/AST for symbols)
const llm_1 = require("./llm");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv.config();
async function analyzeFile(projectKey, filePath) {
    // Read file content
    const code = fs.readFileSync(filePath, 'utf-8');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error('GEMINI_API_KEY not set in .env');
    const llm = (0, llm_1.getGeminiLLM)(apiKey);
    // Prompt Gemini to extract symbols and structure
    const prompt = `Extract all interfaces, classes, and functions from the following code. Return a Markdown summary and a Mermaid diagram for any data structures.\n\nCode:\n\n${code}`;
    const response = await llm.invoke(prompt);
    // Extract text from Gemini response (LangChain returns {content: string} or similar)
    if (typeof response === 'string')
        return response;
    if (response && typeof response.content === 'string')
        return response.content;
    if (response && response.text)
        return response.text;
    return JSON.stringify(response);
}
