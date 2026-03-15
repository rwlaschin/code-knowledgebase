/**
 * Tests for discoveryClient: startDiscoveryClient, stopDiscoveryClient, and
 * message handling (throttle, POST to registerUrl). Uses mocks for dgram and http.
 */

import * as dgram from 'dgram';
import * as http from 'http';
import * as https from 'https';
import { startDiscoveryClient, stopDiscoveryClient } from '@/discoveryClient';
import { MOCK_STATS_PORT } from './testConstants';

const handlers: Record<string, (...args: unknown[]) => void> = {};
const mockSocket: {
  on: jest.Mock;
  bind: jest.Mock;
  setBroadcast: jest.Mock;
  close: jest.Mock;
} = {
  on: jest.fn((event: string, fn: (...args: unknown[]) => void) => {
    handlers[event] = fn;
    return mockSocket;
  }) as jest.Mock,
  bind: jest.fn((_port: number, cb: () => void) => {
    setImmediate(cb);
  }),
  setBroadcast: jest.fn(),
  close: jest.fn()
};

jest.mock('dgram', () => ({
  createSocket: jest.fn(() => mockSocket)
}));

const mockHttpRequest = jest.fn();
jest.mock('http', () => ({
  request: (...args: unknown[]) => mockHttpRequest(...args)
}));
jest.mock('https', () => ({
  request: (...args: unknown[]) => mockHttpRequest(...args)
}));

function getMessageHandler(): (msg: Buffer) => void {
  return handlers['message'] as (msg: Buffer) => void;
}

function getErrorHandler(): (err: NodeJS.ErrnoException) => void {
  return handlers['error'] as (err: NodeJS.ErrnoException) => void;
}

describe('discoveryClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stopDiscoveryClient();
    mockHttpRequest.mockImplementation((options: http.RequestOptions, cb?: (res: http.IncomingMessage) => void) => {
      const req = {
        write: jest.fn(),
        end: jest.fn(),
        setTimeout: jest.fn(),
        destroy: jest.fn(),
        on: jest.fn()
      };
      setImmediate(() => {
        if (typeof cb === 'function') {
          const res = { resume: jest.fn() } as unknown as http.IncomingMessage;
          cb(res);
        }
      });
      return req;
    });
  });

  describe('startDiscoveryClient', () => {
    it('creates a UDP socket and binds to DISCOVERY_PORT', () => {
      startDiscoveryClient(3100);
      expect(dgram.createSocket).toHaveBeenCalledWith('udp4');
      expect(mockSocket.bind).toHaveBeenCalledWith(9255, expect.any(Function));
    });

    it('is idempotent: second call does not create another socket', () => {
      startDiscoveryClient(MOCK_STATS_PORT);
      startDiscoveryClient(3001);
      expect(dgram.createSocket).toHaveBeenCalledTimes(1);
    });

    it('when message with valid registerUrl is received, POSTs port only', () => {
      startDiscoveryClient(3100);
      const onMessage = getMessageHandler();
      expect(onMessage).toBeDefined();

      const writtenBody: string[] = [];
      mockHttpRequest.mockImplementation((options: http.RequestOptions, cb?: (res: http.IncomingMessage) => void) => {
        const req = {
          write: jest.fn((body: string) => {
            writtenBody.push(body);
          }),
          end: jest.fn(),
          setTimeout: jest.fn(),
          destroy: jest.fn(),
          on: jest.fn()
        };
        if (typeof cb === 'function') cb({ resume: jest.fn() } as unknown as http.IncomingMessage);
        return req;
      });

      const payload = JSON.stringify({
        registerUrl: 'http://192.168.1.1:2999/api/register'
      });
      onMessage(Buffer.from(payload, 'utf8'));

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: '/api/register',
          hostname: '192.168.1.1'
        }),
        expect.any(Function)
      );
      const opts = mockHttpRequest.mock.calls[0][0] as http.RequestOptions;
      expect(Number(opts.port)).toBe(2999);
      expect(writtenBody).toHaveLength(1);
      expect(JSON.parse(writtenBody[0])).toEqual({ port: 3100 });
    });

    it('ignores message without registerUrl', () => {
      startDiscoveryClient(MOCK_STATS_PORT);
      const onMessage = getMessageHandler();
      onMessage(Buffer.from('{}', 'utf8'));
      onMessage(Buffer.from('{"registerUrl":""}', 'utf8'));
      onMessage(Buffer.from('{"registerUrl":"ftp://x"}', 'utf8'));
      expect(mockHttpRequest).not.toHaveBeenCalled();
    });

    it('error handler logs EADDRINUSE as warn', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      startDiscoveryClient(MOCK_STATS_PORT);
      const onError = getErrorHandler();
      const err = new Error('bind EADDRINUSE') as NodeJS.ErrnoException;
      err.code = 'EADDRINUSE';
      onError(err);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('9255'));
      warn.mockRestore();
    });

    it('error handler logs other errors to console.error', () => {
      const errLog = jest.spyOn(console, 'error').mockImplementation(() => {});
      startDiscoveryClient(MOCK_STATS_PORT);
      const onError = getErrorHandler();
      onError(new Error('other') as NodeJS.ErrnoException);
      expect(errLog).toHaveBeenCalled();
      errLog.mockRestore();
    });
  });

  describe('stopDiscoveryClient', () => {
    it('closes socket and clears state', () => {
      startDiscoveryClient(MOCK_STATS_PORT);
      stopDiscoveryClient();
      expect(mockSocket.close).toHaveBeenCalled();
      startDiscoveryClient(3001);
      expect(dgram.createSocket).toHaveBeenCalledTimes(2);
    });

    it('is safe to call when never started', () => {
      expect(() => stopDiscoveryClient()).not.toThrow();
    });
  });
});
