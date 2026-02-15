"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const os = __importStar(require("os"));
const server_1 = require("./stats/server");
const server_2 = require("./mcp/server");
const logger_1 = require("./logger");
function localNetworkHost() {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
        const addrs = ifaces[name];
        if (!addrs)
            continue;
        for (const a of addrs) {
            if (a.family === 'IPv4' && !a.internal)
                return a.address;
        }
    }
    return null;
}
async function main() {
    const port = Number(process.env.PORT) || 3000;
    const statsApp = await (0, server_1.createStatsServer)();
    await statsApp.listen({ port, host: '0.0.0.0' });
    const networkHost = localNetworkHost();
    logger_1.logger.info({
        msg: 'Stats server listening',
        local: `http://localhost:${port}`,
        network: networkHost ? `http://${networkHost}:${port}` : undefined,
        routes: ['/config', '/docs', '/metrics/stream (SSE)']
    });
    logger_1.logger.info({ msg: 'MCP server: add this app as an MCP server in Cursor to connect on stdio' });
    await (0, server_2.createMcpServer)();
}
main().catch((err) => {
    logger_1.logger.fatal(err);
    process.exit(1);
});
