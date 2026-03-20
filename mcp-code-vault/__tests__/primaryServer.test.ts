/**
 * Unit tests for primary TCP server (getCurrentSecondaries, startPrimaryServer, stopPrimaryServer).
 * Uses mocked net so we don't bind to a real port.
 */

const mockPushToStream = jest.fn();
jest.mock('../src/stats/streamChannel', () => ({
  pushToStream: (...args: unknown[]) => mockPushToStream(...args)
}));

const mockListen = jest.fn((port: number, host: string, cb: () => void) => {
  if (typeof cb === 'function') cb();
});
const mockClose = jest.fn((cb: (err?: Error) => void) => {
  if (typeof cb === 'function') cb();
});
let connectionCallback: ((socket: unknown) => void) | null = null;

const mockCreateServer = jest.fn((cb: (socket: unknown) => void) => {
  connectionCallback = cb;
  return {
    listen: mockListen,
    close: mockClose
  };
});

jest.mock('net', () => ({
  createServer: (cb: (socket: unknown) => void) => mockCreateServer(cb)
}));

const { getCurrentSecondaries, startPrimaryServer, stopPrimaryServer } = require('../src/primaryServer');

describe('primaryServer', () => {
  beforeEach(() => {
    mockPushToStream.mockClear();
    mockListen.mockClear();
    mockClose.mockClear();
    mockCreateServer.mockClear();
    connectionCallback = null;
  });

  afterEach(async () => {
    await stopPrimaryServer();
  });

  describe('getCurrentSecondaries', () => {
    it('returns empty array when no clients connected', () => {
      expect(getCurrentSecondaries()).toEqual([]);
    });
  });

  describe('startPrimaryServer', () => {
    it('creates server and listens on PRIMARY_TCP_PORT', () => {
      startPrimaryServer(3999);
      expect(mockCreateServer).toHaveBeenCalled();
      expect(mockListen).toHaveBeenCalledWith(9256, '127.0.0.1', expect.any(Function));
    });

    it('is idempotent: second call does not create another server', () => {
      startPrimaryServer(3999);
      startPrimaryServer(3999);
      expect(mockCreateServer).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopPrimaryServer', () => {
    it('closes server and clears state', async () => {
      startPrimaryServer(3999);
      await stopPrimaryServer();
      expect(mockClose).toHaveBeenCalled();
      expect(getCurrentSecondaries()).toEqual([]);
    });

    it('is safe to call when server was never started', async () => {
      await expect(stopPrimaryServer()).resolves.toBeUndefined();
    });
  });
});
