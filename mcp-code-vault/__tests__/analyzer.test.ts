const mockReadFileSync = jest.fn();
const mockInvoke = jest.fn();

jest.mock('fs', () => ({
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args)
}));

jest.mock('../src/llm', () => ({
  getGeminiLLM: () => ({ invoke: mockInvoke })
}));

import { analyzeFile } from '../src/analyzer';

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
    await expect(analyzeFile('proj', '/f')).rejects.toThrow('GEMINI_API_KEY');
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('returns string response from llm.invoke', async () => {
    mockReadFileSync.mockReturnValue('const x = 1;');
    mockInvoke.mockResolvedValue('Summary: one variable');
    const out = await analyzeFile('proj', '/f.ts');
    expect(out).toBe('Summary: one variable');
    expect(mockInvoke).toHaveBeenCalledWith(expect.stringContaining('const x = 1;'));
  });

  it('returns response.content when response is object with content', async () => {
    mockReadFileSync.mockReturnValue('code');
    mockInvoke.mockResolvedValue({ content: 'Content summary' });
    const out = await analyzeFile('proj', '/f');
    expect(out).toBe('Content summary');
  });

  it('returns response.text when response has text', async () => {
    mockReadFileSync.mockReturnValue('code');
    mockInvoke.mockResolvedValue({ text: 'Text summary' });
    const out = await analyzeFile('proj', '/f');
    expect(out).toBe('Text summary');
  });

  it('returns JSON.stringify when response is other shape', async () => {
    mockReadFileSync.mockReturnValue('code');
    mockInvoke.mockResolvedValue({ other: true });
    const out = await analyzeFile('proj', '/f');
    expect(out).toBe(JSON.stringify({ other: true }));
  });
});
