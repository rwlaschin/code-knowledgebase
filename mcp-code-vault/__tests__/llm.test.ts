import { getGeminiLLM } from '../src/llm';

describe('getGeminiLLM', () => {
  it('returns an LLM instance for a given API key', () => {
    const llm = getGeminiLLM('test-api-key');
    expect(llm).toBeDefined();
    expect(llm).toBeTruthy();
  });

  it('returns an object with invoke method for prompts', () => {
    const llm = getGeminiLLM('test-api-key');
    expect(typeof llm.invoke).toBe('function');
  });
});
