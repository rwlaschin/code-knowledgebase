/**
 * On startup: get batches of files from the project directory, match with FileProcessor
 * (modified vs processedAt), POST metrics to primary (POST /metrics), stub processing, configurable batch size and pause.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getProjectRoot } from './scannerRequirements';
import { listFilesUnderRoot } from './scanner';
import { getFileProcessorProcessedAtMap } from './db/projectDb';
import { Project } from './db/models/Project';
import { postMetric } from './stats/metricsClient';

const INSTANCE_ID = process.env.INSTANCE_ID ?? 'mcp-code-vault';

/** Metric key (stored as `operation` on POST /metrics). All file-processing metrics use this key. */
export const FILE_PROCESSING_METRIC_KEY = 'file processing';

/** `metadata.action` for the three phases. */
export const FILE_PROCESSING_ACTION_START = 'start';
export const FILE_PROCESSING_ACTION_BATCH = 'batch';
export const FILE_PROCESSING_ACTION_END = 'end';

const DEFAULT_BATCH_SIZE = 30;
const DEFAULT_PAUSE_MS = 100;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs on every startup: list files (using existing ignore rules), compare with FileProcessor
 * (mtime vs processedAt; missing in DB = auto process), post metrics to primary via postMetric → POST /metrics,
 * stub process batches, pause between.
 */
export async function runFileProcessingStartup(projectKey: string): Promise<void> {
  const project = await Project.findOne({ key: projectKey }).lean().exec();
  const batchSize = project?.file_processing_batch_size ?? DEFAULT_BATCH_SIZE;
  const pauseMs = project?.file_processing_pause_ms ?? DEFAULT_PAUSE_MS;

  const dir = await getProjectRoot(projectKey);
  const allPaths = listFilesUnderRoot(dir);
  const processedAtMap = await getFileProcessorProcessedAtMap(projectKey);

  const toProcess: string[] = [];
  for (const filePath of allPaths) {
    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }
    const mtime = stat.mtimeMs;
    const processedAt = processedAtMap.get(filePath);
    if (processedAt == null || mtime > processedAt.getTime()) {
      toProcess.push(filePath);
    }
  }

  const batches: string[][] = [];
  for (let i = 0; i < toProcess.length; i += batchSize) {
    batches.push(toProcess.slice(i, i + batchSize));
  }

  const startedAt = new Date().toISOString();
  await postMetric({
    instance_id: INSTANCE_ID,
    operation: FILE_PROCESSING_METRIC_KEY,
    kind: 'event',
    started_at: startedAt,
    ended_at: startedAt,
    duration_ms: 0,
    status: 'ok',
    metadata: {
      action: FILE_PROCESSING_ACTION_START,
      projectKey,
      dir,
      batchSize,
      ts: startedAt,
      batchCount: batches.length,
      filesToProcess: toProcess.length
    }
  });

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const firstPath = batch[0];
    const lastPath = batch[batch.length - 1];
    const firstFileName = firstPath ? path.basename(firstPath) : '';
    const lastFileName = lastPath ? path.basename(lastPath) : '';
    const batchTs = new Date().toISOString();

    await postMetric({
      instance_id: INSTANCE_ID,
      operation: FILE_PROCESSING_METRIC_KEY,
      kind: 'event',
      started_at: batchTs,
      ended_at: batchTs,
      duration_ms: 0,
      status: 'ok',
      metadata: {
        action: FILE_PROCESSING_ACTION_BATCH,
        projectKey,
        batch: i + 1,
        firstFileName,
        lastFileName,
        ts: batchTs,
        path: dir
      }
    });

    const batchStart = Date.now();
    const processStartedAt = new Date(batchStart).toISOString();
    // Stub processing (for now)
    await delay(0);
    const processEndedAt = new Date().toISOString();
    const durationMs = Date.now() - batchStart;

    await postMetric({
      instance_id: INSTANCE_ID,
      operation: FILE_PROCESSING_METRIC_KEY,
      kind: 'event',
      started_at: processStartedAt,
      ended_at: processEndedAt,
      duration_ms: durationMs,
      status: 'ok',
      metadata: {
        action: FILE_PROCESSING_ACTION_END,
        projectKey,
        batch: i + 1,
        firstFileName,
        lastFileName,
        path: dir,
        ts: processEndedAt
      }
    });

    await delay(pauseMs);
  }
}
