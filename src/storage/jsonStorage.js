/*
 * CodeCollab Centralized Atomic JSON Storage
 * ----------------------------------------------------------------------
 * Provides serialized read-modify-write operations per file path,
 * atomic writing via temporary files and fsync/rename,
 * and explicit corruption detection (no silent empty state on corrupt data).
 */

const fs = require('fs/promises');
const path = require('path');
const { existsSync } = require('fs');

class JsonCorruptionError extends Error {
    constructor(filePath, originalError) {
        super(`Corrupted JSON detected in storage file: ${filePath} (${originalError ? originalError.message : 'Invalid JSON'})`);
        this.name = 'JsonCorruptionError';
        this.filePath = filePath;
        this.originalError = originalError;
    }
}

// In-memory mutex queues keyed by absolute file path
const fileLockQueues = new Map();

/**
 * Execute an async operation with per-path serialization.
 */
function acquireLock(filePath, fn) {
    const normalizedPath = path.resolve(filePath);
    const currentQueue = fileLockQueues.get(normalizedPath) || Promise.resolve();

    let release;
    const nextQueue = new Promise((resolve) => {
        release = resolve;
    });

    // Chain next queue item
    fileLockQueues.set(normalizedPath, currentQueue.then(() => nextQueue));

    return currentQueue
        .then(fn)
        .finally(() => {
            release();
            if (fileLockQueues.get(normalizedPath) === nextQueue) {
                fileLockQueues.delete(normalizedPath);
            }
        });
}

/**
 * Read and parse JSON from disk.
 * Throws JsonCorruptionError if file contains invalid JSON.
 */
async function readJson(filePath, defaultValue = undefined) {
    const resolvedPath = path.resolve(filePath);

    let content;
    try {
        content = await fs.readFile(resolvedPath, 'utf-8');
    } catch (err) {
        if (err.code === 'ENOENT') {
            if (defaultValue !== undefined) {
                return JSON.parse(JSON.stringify(defaultValue));
            }
            throw err;
        }
        throw err;
    }

    const trimmed = content.trim();
    if (!trimmed) {
        if (defaultValue !== undefined) {
            return JSON.parse(JSON.stringify(defaultValue));
        }
        throw new JsonCorruptionError(resolvedPath, new Error('File is unexpectedly empty'));
    }

    try {
        return JSON.parse(trimmed);
    } catch (err) {
        throw new JsonCorruptionError(resolvedPath, err);
    }
}

/**
 * Atomically write data to disk using temporary file, sync, and rename.
 */
async function writeJsonAtomic(filePath, data) {
    const resolvedPath = path.resolve(filePath);
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });

    const tempPath = path.join(
        dir,
        `.${path.basename(resolvedPath)}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
    );

    const jsonString = JSON.stringify(data, null, 2);

    try {
        // 1. Write to temporary file
        await fs.writeFile(tempPath, jsonString, 'utf-8');

        // 2. Fsync file if possible to ensure bytes hit disk
        try {
            const handle = await fs.open(tempPath, 'r+');
            await handle.sync();
            await handle.close();
        } catch {
            // Some virtual file systems may not support handle.sync()
        }

        // 3. Atomically rename temporary file over target
        // On Windows, fs.rename atomically replaces existing files in Node 12+
        // In rare permission locks on Windows, fall back to copy+unlink if needed
        try {
            await fs.rename(tempPath, resolvedPath);
        } catch (renameErr) {
            if (process.platform === 'win32') {
                await fs.copyFile(tempPath, resolvedPath);
                await fs.unlink(tempPath).catch(() => {});
            } else {
                throw renameErr;
            }
        }
    } catch (err) {
        // Clean up temp file on failure
        await fs.unlink(tempPath).catch(() => {});
        throw err;
    }
}

/**
 * Thread-safe / concurrency-safe read-modify-write operation on a JSON file.
 */
async function modifyJson(filePath, modifierFn, defaultValue = []) {
    return acquireLock(filePath, async () => {
        const currentData = await readJson(filePath, defaultValue);
        const modified = await modifierFn(currentData);
        const dataToSave = modified !== undefined ? modified : currentData;
        await writeJsonAtomic(filePath, dataToSave);
        return dataToSave;
    });
}

/**
 * Serialized writeJson.
 */
async function writeJson(filePath, data) {
    return acquireLock(filePath, async () => {
        await writeJsonAtomic(filePath, data);
        return data;
    });
}

module.exports = {
    JsonCorruptionError,
    readJson,
    writeJson,
    modifyJson,
    acquireLock
};
