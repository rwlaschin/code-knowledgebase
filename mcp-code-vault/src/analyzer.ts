// Code Parser (Regex/AST for symbols)
import { getGeminiLLM } from './llm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ quiet: true });

export async function analyzeFile(projectKey: string, filePath: string): Promise<string> {
  // Read file content
  const code = fs.readFileSync(filePath, 'utf-8');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env');
  const llm = getGeminiLLM(apiKey);
  // Prompt Gemini to extract symbols and structure
  const prompt = `Extract all interfaces, classes, and functions from the following code. Return a Markdown summary and a Mermaid diagram for any data structures.\n\nCode:\n\n${code}`;
  const response = await llm.invoke(prompt);
  // Extract text from Gemini response (LangChain returns {content: string} or similar)
  if (typeof response === 'string') return response;
  if (typeof response?.content === 'string') return response.content!;
  if (response?.text) return response.text;
  return JSON.stringify(response);
}
