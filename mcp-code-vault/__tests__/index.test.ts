jest.mock('os', () => ({
  networkInterfaces: jest.fn(() => ({
    lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
    eth0: [{ family: 'IPv4', internal: false, address: '192.168.1.10' }]
  }))
}));

jest.mock('../src/stats/server', () => ({ createStatsServer: jest.fn() }));
jest.mock('../src/mcp/server', () => ({ createMcpServer: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/logger', () => ({ logger: { info: jest.fn(), fatal: jest.fn() } }));
jest.mock('../src/discoveryClient', () => ({
  startDiscoveryClient: jest.fn(),
  stopDiscoveryClient: jest.fn()
}));
const createStatsServer = require('../src/stats/server').createStatsServer;
const createMcpServer = require('../src/mcp/server').createMcpServer;
const { logger } = require('../src/logger');

const { main, localNetworkHost } = require('../src/index');

describe('index', () => {
  describe('localNetworkHost', () => {
    it('returns first IPv4 non-internal address or null', () => {
      const result = localNetworkHost();
      expect(result).toBe('192.168.1.10');
    });
    it('returns null when no external IPv4', () => {
      const os = require('os');
      os.networkInterfaces.mockReturnValueOnce({
        lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }]
      });
      const r = localNetworkHost();
      expect(r).toBe(null);
    });
  });

  describe('main', () => {
    it('throws when PORT is invalid (e.g. negative)', async () => {
      const origPort = process.env.PORT;
      process.env.PORT = '-1';
      try {
        await expect(main()).rejects.toThrow('PORT must be a non-negative integer');
      } finally {
        if (origPort !== undefined) process.env.PORT = origPort;
        else delete process.env.PORT;
      }
    });

    it('sets context, creates MCP server, then stats server and listens', async () => {
      const mockListen = jest.fn().mockResolvedValue(undefined);
      createStatsServer.mockResolvedValue({ server: {}, listen: mockListen });

      const origPort = process.env.PORT;
      const origMongo = process.env.MONGO_URL;
      process.env.PORT = '3999';
      process.env.MONGO_URL = 'mongodb://localhost:27017/test'; // so stats server is started (not MCP-only skip)
      try {
        await main();
      } finally {
        process.env.PORT = origPort;
        if (origMongo !== undefined) process.env.MONGO_URL = origMongo;
        else delete process.env.MONGO_URL;
      }

      expect(createStatsServer).toHaveBeenCalled();
      expect(mockListen).toHaveBeenCalledWith({ port: 3999, host: '0.0.0.0' });
      expect(logger.info).toHaveBeenCalled();
      expect(createMcpServer).toHaveBeenCalled();
    });
  });
});
