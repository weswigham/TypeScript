import type {
    Readable,
    Writable,
} from "node:stream";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import {
    createMessageConnection,
    StreamMessageReader,
    StreamMessageWriter,
} from "../../vendor/vscode-jsonrpc/lib/node/main.js";
import { PROTOCOL_VERSION } from "../api/node/protocol.ts";
import {
    record,
    string,
} from "./validation.ts";

function nativeWorkerId(value: unknown): number {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("Invalid native worker id");
    return value;
}

export async function runShim(input: Readable = process.stdin, output: Writable = process.stdout, diagnostics: Writable = process.stderr): Promise<void> {
    const connection = createMessageConnection(new StreamMessageReader(input), new StreamMessageWriter(output));
    const workers = new Map<number, { worker: Worker; cancellation: Int32Array<ArrayBufferLike>; }>();
    const seenWorkerIds = new Set<number>();
    connection.onRequest("initialize", (value: unknown) => {
        const request = record(value, "Lint initialization");
        if (request.protocolVersion !== 1 || request.astProtocolVersion !== PROTOCOL_VERSION) throw new Error("Lint API protocol mismatch");
        return { protocolVersion: 1, astProtocolVersion: PROTOCOL_VERSION };
    });
    connection.onRequest("createWorker", async (value: unknown) => {
        const request = record(value, "Native worker request");
        const id = nativeWorkerId(request.workerId);
        if (seenWorkerIds.has(id)) throw new Error(`Native worker id ${id} is not new`);
        seenWorkerIds.add(id);
        const cancellation = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
        const worker = new Worker(new URL(import.meta.url.endsWith(".ts") ? "./worker.ts" : "./worker.js", import.meta.url), {
            workerData: { pipe: string(request.pipe, "API pipe"), cancellation: cancellation.buffer },
            stdout: true,
            stderr: true,
        });
        workers.set(id, { worker, cancellation });
        worker.on("error", error => {
            diagnostics.write(`Lint worker ${id}: ${error.stack ?? error.message}\n`);
            void worker.terminate();
        });
        worker.stdout.on("data", (chunk: Buffer) => diagnostics.write(chunk));
        worker.stderr.on("data", (chunk: Buffer) => diagnostics.write(chunk));
        worker.once("exit", () => {
            workers.delete(id);
        });
        try {
            await new Promise<void>((resolve, reject) => {
                const cleanup = () => {
                    worker.off("message", onMessage);
                    worker.off("error", onError);
                    worker.off("exit", onExit);
                };
                const onMessage = (value: unknown) => {
                    cleanup();
                    try {
                        if (record(value, "Worker initialization").type !== "ready") throw new Error("Worker did not initialize its API connection");
                        resolve();
                    }
                    catch (error) {
                        reject(error);
                    }
                };
                const onError = (error: Error) => {
                    cleanup();
                    reject(error);
                };
                const onExit = (code: number) => {
                    cleanup();
                    reject(new Error(`Worker exited during initialization (${code})`));
                };
                worker.once("message", onMessage);
                worker.once("error", onError);
                worker.once("exit", onExit);
            });
        }
        catch (error) {
            workers.delete(id);
            await worker.terminate();
            throw error;
        }
        return null;
    });
    connection.onRequest("cancelWorker", (value: unknown) => {
        const request = record(value, "Worker cancellation");
        const id = nativeWorkerId(request.workerId);
        if (typeof request.workId !== "number" || !Number.isInteger(request.workId) || (request.workId | 0) !== request.workId) throw new Error("Invalid native work id");
        const entry = workers.get(id);
        if (entry) Atomics.store(entry.cancellation, 0, request.workId);
        return null;
    });
    connection.onRequest("destroyWorker", async (value: unknown) => {
        const id = nativeWorkerId(record(value, "Worker destruction").workerId);
        const entry = workers.get(id);
        if (!seenWorkerIds.has(id)) throw new Error(`Unknown native worker ${id}`);
        workers.delete(id);
        await entry?.worker.terminate();
        return null;
    });
    const closed = new Promise<void>((resolve, reject) => {
        connection.onClose(resolve);
        connection.onError(([error]) => reject(error));
    });
    connection.listen();
    try {
        await closed;
    }
    finally {
        await Promise.all([...workers.values()].map(({ worker }) => worker.terminate()));
        connection.dispose();
    }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
    runShim().catch((error: unknown) => {
        process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
        process.exitCode = 1;
    });
}
