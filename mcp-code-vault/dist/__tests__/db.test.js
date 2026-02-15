"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockClose = jest.fn().mockResolvedValue(undefined);
const mockDb = { collection: jest.fn() };
const mockInstance = {
    connect: mockConnect,
    close: mockClose,
    db: jest.fn().mockReturnValue(mockDb)
};
jest.mock('mongodb', () => ({
    MongoClient: jest.fn(() => mockInstance)
}));
const db_1 = require("../src/db");
describe('db', () => {
    beforeEach(() => {
        mockConnect.mockClear();
    });
    it('connectToDatabase returns db and caches on second call', async () => {
        const db1 = await (0, db_1.connectToDatabase)();
        const db2 = await (0, db_1.connectToDatabase)();
        expect(db1).toBe(mockDb);
        expect(db2).toBe(db1);
        expect(mockConnect).toHaveBeenCalledTimes(1);
    });
    it('closeDatabase closes client', async () => {
        await (0, db_1.connectToDatabase)();
        await (0, db_1.closeDatabase)();
        expect(mockClose).toHaveBeenCalled();
    });
});
