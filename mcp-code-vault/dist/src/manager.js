"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectManager = void 0;
// Project Registry logic (mapping paths to IDs)
const db_1 = require("./db");
const crypto_1 = require("crypto");
class ProjectManager {
    async registerProject(root_path, name) {
        const db = await (0, db_1.connectToDatabase)();
        const project_key = 'VAULT-' + (0, crypto_1.randomBytes)(4).toString('hex').toUpperCase();
        const doc = {
            project_key,
            root_path,
            name: name || null,
            exclude_patterns: [],
            last_sync: null
        };
        await db.collection('registry').insertOne(doc);
        return project_key;
    }
}
exports.ProjectManager = ProjectManager;
