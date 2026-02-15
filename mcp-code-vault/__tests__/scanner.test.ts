const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn().mockResolvedValue(undefined);

jest.mock('../src/db', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({
    collection: jest.fn().mockImplementation((name: string) => {
      if (name === 'registry') return { findOne: mockFindOne };
      if (name === 'symbols') return { updateOne: mockUpdateOne };
      return {};
    })
  })
}));

jest.mock('../src/utils/ignore-mgr', () => ({
  shouldIgnore: jest.fn((path: string) => path.includes('node_modules'))
}));

jest.mock('../src/analyzer', () => ({
  analyzeFile: jest.fn().mockResolvedValue('class Foo {} function bar() {}')
}));

const mockReaddirSync = jest.fn();
const mockStatSync = jest.fn();

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  readdirSync: mockReaddirSync,
  statSync: mockStatSync
}));

jest.mock('path', () => ({
  join: (...args: string[]) => args.join('/')
}));

const mockWatch = jest.fn().mockReturnValue({ on: jest.fn() });
jest.mock('chokidar', () => ({
  __esModule: true,
  default: { watch: mockWatch }
}));

import { scanProject } from '../src/scanner';

describe('scanProject', () => {
  beforeEach(() => {
    mockFindOne.mockReset();
    mockUpdateOne.mockClear();
    mockReaddirSync.mockReset();
    mockStatSync.mockReset();
  });

  it('throws when project not found', async () => {
    mockFindOne.mockResolvedValue(null);
    await expect(scanProject('unknown')).rejects.toThrow('Project not found');
  });

  it('returns counts when project exists and walk finds one file', async () => {
    mockFindOne.mockResolvedValue({ project_key: 'K', root_path: '/root' });
    mockReaddirSync.mockReturnValue(['a.ts']);
    mockStatSync.mockReturnValue({ isDirectory: () => false });

    const result = await scanProject('K');

    expect(result).toEqual({
      filesScanned: 1,
      filesUpdated: 1,
      symbolsFound: 2
    });
    expect(mockUpdateOne).toHaveBeenCalled();
  });

  it('skips directories and nested files', async () => {
    mockFindOne.mockResolvedValue({ project_key: 'K', root_path: '/root' });
    mockReaddirSync
      .mockReturnValueOnce(['dir', 'file.ts'])
      .mockReturnValueOnce(['nested.ts']);
    mockStatSync
      .mockReturnValueOnce({ isDirectory: () => true })
      .mockReturnValueOnce({ isDirectory: () => false })
      .mockReturnValueOnce({ isDirectory: () => false });

    const result = await scanProject('K');

    expect(result.filesScanned).toBe(2);
    expect(result.filesUpdated).toBe(2);
  });
});
