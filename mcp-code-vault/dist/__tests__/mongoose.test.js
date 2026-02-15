"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);
jest.mock('mongoose', () => ({
    __esModule: true,
    default: {
        connect: mockConnect,
        disconnect: mockDisconnect,
        models: {},
        model: jest.fn()
    }
}));
const mongoose_1 = require("../src/db/mongoose");
describe('mongoose', () => {
    beforeEach(() => {
        mockDisconnect.mockClear();
    });
    describe('connectMongoose', () => {
        it('calls mongoose.connect with a mongo url', async () => {
            await (0, mongoose_1.connectMongoose)();
            expect(mockConnect).toHaveBeenCalledWith(expect.stringMatching(/^mongodb:\/\//));
        });
        it('returns without calling connect again when already connected', async () => {
            await (0, mongoose_1.connectMongoose)();
            await (0, mongoose_1.connectMongoose)();
            expect(mockConnect).toHaveBeenCalledTimes(1);
        });
    });
    describe('disconnectMongoose', () => {
        it('calls mongoose.disconnect when connected', async () => {
            await (0, mongoose_1.connectMongoose)();
            await (0, mongoose_1.disconnectMongoose)();
            expect(mockDisconnect).toHaveBeenCalled();
        });
    });
});
