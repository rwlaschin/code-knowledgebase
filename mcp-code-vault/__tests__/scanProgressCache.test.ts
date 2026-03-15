jest.mock('../src/stats/streamChannel', () => ({
  pushToStream: jest.fn()
}));

import {
  reportScanProgress,
  getScanProgress,
  getDefaultScanProgress,
  type ScanProgressPayload
} from '../src/stats/scanProgressCache';

describe('scanProgressCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getDefaultScanProgress', () => {
    it('returns default payload with zeros and optional projectKey', () => {
      const out = getDefaultScanProgress();
      expect(out).toEqual({
        filesProcessed: 0,
        filesUpdated: 0,
        files: [],
        projectKey: undefined
      });
    });

    it('includes projectKey when provided', () => {
      const out = getDefaultScanProgress('my-project');
      expect(out.projectKey).toBe('my-project');
    });
  });

  describe('getScanProgress', () => {
    it('returns null when cache is empty', () => {
      expect(getScanProgress('any')).toBeNull();
    });

    it('returns cached payload after reportScanProgress', () => {
      const payload: ScanProgressPayload = {
        filesProcessed: 5,
        filesUpdated: 2,
        projectKey: 'default'
      };
      reportScanProgress(payload);
      jest.advanceTimersByTime(0);
      expect(getScanProgress('default')).toEqual(payload);
    });

    it('falls back to default key when projectKey not in cache', () => {
      const payload: ScanProgressPayload = {
        filesProcessed: 1,
        filesUpdated: 0,
        projectKey: 'default'
      };
      reportScanProgress(payload);
      jest.advanceTimersByTime(0);
      expect(getScanProgress('other')).toEqual(payload);
    });
  });

  describe('reportScanProgress', () => {
    it('updates cache so getScanProgress returns payload', () => {
      const payload: ScanProgressPayload = {
        filesProcessed: 10,
        filesUpdated: 3,
        projectKey: 'p1'
      };
      reportScanProgress(payload);
      jest.advanceTimersByTime(0);
      expect(getScanProgress('p1')).toEqual(payload);
    });

    it('stores payload under default when projectKey is omitted', () => {
      reportScanProgress({ filesProcessed: 1, filesUpdated: 0 });
      jest.advanceTimersByTime(0);
      expect(getScanProgress('default')).toEqual({ filesProcessed: 1, filesUpdated: 0 });
    });

    it('throttles rapid calls: second payload is visible after advance', () => {
      reportScanProgress({ filesProcessed: 1, filesUpdated: 0, projectKey: 'p1' });
      reportScanProgress({ filesProcessed: 2, filesUpdated: 1, projectKey: 'p1' });
      expect(getScanProgress('p1')?.filesProcessed).toBe(2);
      jest.advanceTimersByTime(600);
      expect(getScanProgress('p1')?.filesProcessed).toBe(2);
    });
  });
});
