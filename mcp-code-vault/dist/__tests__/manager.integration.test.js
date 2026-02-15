"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = require("../src/manager");
const db_1 = require("../src/db");
describe('ProjectManager Integration', () => {
    let db;
    beforeAll(async () => {
        db = await (0, db_1.connectToDatabase)();
    });
    afterAll(async () => {
        // Clean up test data and close DB connection
        if (db) {
            await db.collection('registry').deleteMany({ root_path: '/tmp', name: 'TestProject' });
        }
        await (0, db_1.closeDatabase)();
    });
    it('should register a project and store it in MongoDB', async () => {
        const mgr = new manager_1.ProjectManager();
        const projectKey = await mgr.registerProject('/tmp', 'TestProject');
        expect(typeof projectKey).toBe('string');
        expect(projectKey.length).toBeGreaterThan(0);
        const found = await db.collection('registry').findOne({ project_key: projectKey });
        expect(found).toBeTruthy();
        expect(found.root_path).toBe('/tmp');
        expect(found.name).toBe('TestProject');
    });
});
