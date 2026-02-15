"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const llm_1 = require("../src/llm");
describe('getGeminiLLM', () => {
    it('returns an LLM instance for a given API key', () => {
        const llm = (0, llm_1.getGeminiLLM)('test-api-key');
        expect(llm).toBeDefined();
        expect(llm).toBeTruthy();
    });
    it('returns an object with invoke method for prompts', () => {
        const llm = (0, llm_1.getGeminiLLM)('test-api-key');
        expect(typeof llm.invoke).toBe('function');
    });
});
