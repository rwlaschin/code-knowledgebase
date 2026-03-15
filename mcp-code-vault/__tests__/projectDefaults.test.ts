import * as fs from 'fs';
import {
  readCurrentBranchFromRoot,
  ensureProjectDefaults
} from '../src/db/projectDefaults';

jest.mock('fs');
jest.mock('../src/scannerRequirements', () => ({
  getProjectRoot: jest.fn()
}));
jest.mock('../src/db/projectDb', () => ({
  ensureProjectCollections: jest.fn().mockResolvedValue(undefined),
  hasAnyPaths: jest.fn(),
  getOrCreateBranch: jest.fn().mockResolvedValue(undefined)
}));

const mockGetProjectRoot = jest.requireMock('../src/scannerRequirements').getProjectRoot as jest.Mock;
const mockEnsureProjectCollections = jest.requireMock('../src/db/projectDb').ensureProjectCollections as jest.Mock;
const mockHasAnyPaths = jest.requireMock('../src/db/projectDb').hasAnyPaths as jest.Mock;
const mockGetOrCreateBranch = jest.requireMock('../src/db/projectDb').getOrCreateBranch as jest.Mock;

describe('projectDefaults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('readCurrentBranchFromRoot', () => {
    it('returns branch name from ref: refs/heads/<name>', () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('ref: refs/heads/main\n');
      expect(readCurrentBranchFromRoot('/some/root')).toBe('main');
    });

    it('returns HEAD when detached or unreadable', () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('abc123\n');
      expect(readCurrentBranchFromRoot('/some/root')).toBe('HEAD');
    });

    it('returns HEAD when readFileSync throws', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT');
      });
      expect(readCurrentBranchFromRoot('/some/root')).toBe('HEAD');
    });

    it('trims branch name', () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('ref: refs/heads/  develop  \n');
      expect(readCurrentBranchFromRoot('/some/root')).toBe('develop');
    });
  });

  describe('ensureProjectDefaults', () => {
    it('calls ensureProjectCollections and returns early when hasAnyPaths is true', async () => {
      mockHasAnyPaths.mockResolvedValue(true);
      mockGetProjectRoot.mockResolvedValue('/root');

      await ensureProjectDefaults('my-key');

      expect(mockEnsureProjectCollections).toHaveBeenCalledWith('my-key');
      expect(mockHasAnyPaths).toHaveBeenCalledWith('my-key');
      expect(mockGetProjectRoot).not.toHaveBeenCalled();
      expect(mockGetOrCreateBranch).not.toHaveBeenCalled();
    });

    it('reads branch from root and calls getOrCreateBranch when NEW (no paths)', async () => {
      mockHasAnyPaths.mockResolvedValue(false);
      mockGetProjectRoot.mockResolvedValue('/proj/root');
      (fs.readFileSync as jest.Mock).mockReturnValue('ref: refs/heads/main\n');

      await ensureProjectDefaults('my-key');

      expect(mockEnsureProjectCollections).toHaveBeenCalledWith('my-key');
      expect(mockHasAnyPaths).toHaveBeenCalledWith('my-key');
      expect(mockGetProjectRoot).toHaveBeenCalledWith('my-key');
      expect(mockGetOrCreateBranch).toHaveBeenCalledWith('my-key', 'main');
    });
  });
});
