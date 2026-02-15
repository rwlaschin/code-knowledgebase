"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Integration test: real startup works.
 * - Spawns the actual app process (ts-node src/index.ts) and asserts it reaches
 *   "Stats server listening" without MODULE_NOT_FOUND. Requires MongoDB.
 * - Spawns platform-ui dev (npx nuxt dev) and asserts nuxt is found and starts.
 */
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const repoRoot = path_1.default.resolve(__dirname, '..');
const platformUiRoot = path_1.default.join(repoRoot, 'platform-ui');
function run(cmd, args, cwd, env = {}) {
    return new Promise((resolve) => {
        const proc = (0, child_process_1.spawn)(cmd, args, {
            cwd,
            env: { ...process.env, ...env },
            shell: true
        });
        let stdout = '';
        let stderr = '';
        proc.stdout?.on('data', (c) => { stdout += c.toString(); });
        proc.stderr?.on('data', (c) => { stderr += c.toString(); });
        proc.on('close', (code) => resolve({ stdout, stderr, code: code ?? null }));
    });
}
function runWithTimeout(cmd, args, cwd, env, timeoutMs) {
    return new Promise((resolve) => {
        let done = false;
        const finish = (out, err, killed) => {
            if (done)
                return;
            done = true;
            clearTimeout(t);
            resolve({ stdout: out, stderr: err, killed });
        };
        const proc = (0, child_process_1.spawn)(cmd, args, {
            cwd,
            env: { ...process.env, ...env },
            shell: true
        });
        let stdout = '';
        let stderr = '';
        proc.stdout?.on('data', (c) => { stdout += c.toString(); });
        proc.stderr?.on('data', (c) => { stderr += c.toString(); });
        const t = setTimeout(() => {
            proc.kill('SIGTERM');
            finish(stdout, stderr, true);
        }, timeoutMs);
        proc.on('close', () => finish(stdout, stderr, false));
    });
}
describe('Startup integration', () => {
    it('mcp-code-vault process starts without MODULE_NOT_FOUND and logs Stats server listening', async () => {
        const { code: buildCode } = await run('npx', ['tsc'], repoRoot);
        expect(buildCode).toBe(0);
        const { stdout, stderr } = await runWithTimeout('node', ['dist/src/index.js'], repoRoot, { PORT: '37654' }, 15000);
        const combined = stdout + stderr;
        expect(combined).not.toContain('MODULE_NOT_FOUND');
        expect(combined).toMatch(/Stats server listening|"msg":"Stats server listening"/);
    }, 25000);
    it('platform-ui dev finds nuxt and starts (no "command not found")', async () => {
        const { stderr } = await runWithTimeout('npm', ['run', 'dev'], platformUiRoot, {}, 12000);
        expect(stderr).not.toMatch(/nuxt: command not found|nuxt: command no/);
    }, 20000);
});
