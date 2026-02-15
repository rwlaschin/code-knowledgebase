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
const hasher_1 = require("../src/utils/hasher");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('calculateMD5', () => {
    const testFile = path.join(__dirname, 'testfile.txt');
    beforeAll(() => {
        fs.writeFileSync(testFile, 'hello world');
    });
    afterAll(() => {
        fs.unlinkSync(testFile);
    });
    it('returns a 32-character hex string', () => {
        const hash = (0, hasher_1.calculateMD5)(testFile);
        expect(typeof hash).toBe('string');
        expect(hash.length).toBe(32);
        expect(hash).toMatch(/^[a-f0-9]+$/);
    });
    it('returns same hash for same content', () => {
        const a = (0, hasher_1.calculateMD5)(testFile);
        const b = (0, hasher_1.calculateMD5)(testFile);
        expect(a).toBe(b);
    });
});
