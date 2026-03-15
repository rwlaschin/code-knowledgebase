/**
 * Per-project DB accessors and collection helpers.
 * All per-project data uses collections: {projectKey}_paths, _branches, _knowledge_base, _path_joins, _branch_joins.
 * Uses mongoose.connection.db (native MongoDB driver); caller must ensure connectMongoose() has been called.
 */

import mongoose from 'mongoose';

// --- Collection name helpers ---

export function pathsCollectionName(projectKey: string): string {
  return `${projectKey}_paths`;
}

export function branchesCollectionName(projectKey: string): string {
  return `${projectKey}_branches`;
}

export function knowledgeBaseCollectionName(projectKey: string): string {
  return `${projectKey}_knowledge_base`;
}

export function pathJoinsCollectionName(projectKey: string): string {
  return `${projectKey}_path_joins`;
}

export function branchJoinsCollectionName(projectKey: string): string {
  return `${projectKey}_branch_joins`;
}

function getDb() {
  const db = mongoose.connection?.db;
  if (!db) throw new Error('Database not connected; call connectMongoose() first');
  return db;
}

/**
 * Ensures the five per-project collections exist and have required indexes.
 * Creating an index on a collection creates the collection if it does not exist.
 */
export async function ensureProjectCollections(projectKey: string): Promise<void> {
  const db = getDb();

  const paths = db.collection(pathsCollectionName(projectKey));
  await paths.createIndex({ path: 1 }, { unique: true });

  const branches = db.collection(branchesCollectionName(projectKey));
  await branches.createIndex({ branch: 1 }, { unique: true });

  const knowledgeBase = db.collection(knowledgeBaseCollectionName(projectKey));
  await knowledgeBase.createIndex({ format: 1 });
  await knowledgeBase.createIndex({ level: 1 });

  const pathJoins = db.collection(pathJoinsCollectionName(projectKey));
  await pathJoins.createIndex({ path_id: 1, atom_id: 1 }, { unique: true });
  await pathJoins.createIndex({ atom_id: 1 });

  const branchJoins = db.collection(branchJoinsCollectionName(projectKey));
  await branchJoins.createIndex({ branch_id: 1, atom_id: 1 }, { unique: true });
  await branchJoins.createIndex({ atom_id: 1 });
}

/**
 * Returns true if the project's _paths collection has at least one document.
 */
export async function hasAnyPaths(projectKey: string): Promise<boolean> {
  const db = getDb();
  const paths = db.collection(pathsCollectionName(projectKey));
  const count = await paths.countDocuments();
  return count > 0;
}

/** Branch document shape (minimal). */
export interface BranchDoc {
  _id: unknown;
  branch: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Find branch by name; if missing, insert and return. Returns doc with _id.
 */
export async function getOrCreateBranch(projectKey: string, branchName: string): Promise<BranchDoc> {
  const db = getDb();
  const branches = db.collection(branchesCollectionName(projectKey));
  const existing = await branches.findOne({ branch: branchName });
  if (existing) return existing as BranchDoc;
  const now = new Date();
  const doc = {
    branch: branchName,
    createdAt: now,
    updatedAt: now
  };
  const result = await branches.insertOne(doc);
  return { _id: result.insertedId, ...doc } as BranchDoc;
}

/**
 * Find branch doc by name. Returns null if not found.
 */
export async function getBranchByName(
  projectKey: string,
  branchName: string
): Promise<BranchDoc | null> {
  const db = getDb();
  const branches = db.collection(branchesCollectionName(projectKey));
  const doc = await branches.findOne({ branch: branchName });
  return doc as BranchDoc | null;
}

/**
 * Return list of branch names for the project.
 */
export async function listBranches(projectKey: string): Promise<string[]> {
  const db = getDb();
  const branches = db.collection(branchesCollectionName(projectKey));
  const docs = await branches.find({}, { projection: { branch: 1 } }).toArray();
  return docs.map((d) => (d as unknown as { branch: string }).branch);
}
