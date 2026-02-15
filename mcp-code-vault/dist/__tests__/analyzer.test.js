"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockReadFileSync = jest.fn();
const mockInvoke = jest.fn();
jest.mock('fs', () => ({
    readFileSync: (...args) => mockReadFileSync(...args)
}));
jest.mock('../src/llm', () => ({
    getGeminiLLM: () => ({ invoke: mockInvoke })
}));
const analyzer_1 = require("../src/analyzer");
describe('analyzeFile', () => {
    const origEnv = process.env.GEMINI_API_KEY;
    beforeEach(() => {
        mockReadFileSync.mockClear();
        mockInvoke.mockClear();
        process.env.GEMINI_API_KEY = 'test-key';
    });
    afterAll(() => {
        process.env.GEMINI_API_KEY = origEnv;
    });
    it('throws when GEMINI_API_KEY is not set', async () => {
        delete process.env.GEMINI_API_KEY;
        await expect((0, analyzer_1.analyzeFile)('proj', '/f')).rejects.toThrow('GEMINI_API_KEY');
        process.env.GEMINI_API_KEY = 'test-key';
    });
    it('returns string response from llm.invoke', async () => {
        mockReadFileSync.mockReturnValue('const x = 1;');
        mockInvoke.mockResolvedValue('Summary: one variable');
        const out = await (0, analyzer_1.analyzeFile)('proj', '/f.ts');
        expect(out).toBe('Summary: one variable');
        expect(mockInvoke).toHaveBeenCalledWith(expect.stringContaining('const x = 1;'));
    });
    it('returns response.content when response is object with content', async () => {
        mockReadFileSync.mockReturnValue('code');
        mockInvoke.mockResolvedValue({ content: 'Content summary' });
        const out = await (0, analyzer_1.analyzeFile)('proj', '/f');
        expect(out).toBe('Content summary');
    });
    it('returns response.text when response has text', async () => {
        mockReadFileSync.mockReturnValue('code');
        mockInvoke.mockResolvedValue({ text: 'Text summary' });
        const out = await (0, analyzer_1.analyzeFile)('proj', '/f');
        expect(out).toBe('Text summary');
    });
    it('returns JSON.stringify when response is other shape', async () => {
        mockReadFileSync.mockReturnValue('code');
        mockInvoke.mockResolvedValue({ other: true });
        const out = await (0, analyzer_1.analyzeFile)('proj', '/f');
        expect(out).toBe(JSON.stringify({ other: true }));
    });
});
