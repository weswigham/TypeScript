import {
    parentPort,
    workerData,
} from "node:worker_threads";
import type {
    ConfigFileResponse,
    CreateSnapshotResponse,
    ProjectResponse,
} from "../api/proto.ts";
import { API } from "../api/sync/api.ts";
import { Client } from "../api/sync/client.ts";
import { executeWork } from "./executor.ts";
import type {
    InspectPluginsRequest,
    LintRequest,
} from "./types.ts";
import {
    record,
    string,
} from "./validation.ts";

if (!parentPort) throw new Error("The native lint worker must run in a worker thread");
const data = record(workerData, "Native worker data");
if (!(data.cancellation instanceof SharedArrayBuffer)) throw new Error("Missing native lint cancellation state");
const cancellation = new Int32Array(data.cancellation);
const client = await Client.connect(string(data.pipe, "API pipe"));
const api = new API({}, client);
type WorkConfiguration = Omit<LintRequest, "kind" | "files"> & { resolvedLibraries: readonly string[]; };
interface NativeLintRequest {
    kind: "lint";
    configuration: WorkConfiguration | "reuse";
    files: LintRequest["files"];
    snapshot: Omit<CreateSnapshotResponse, "projects"> & {
        projects: (Omit<ProjectResponse, "parsedCommandLine"> & { parsedCommandLine: ConfigFileResponse | "reuse"; })[];
    };
}
let lastConfiguration: WorkConfiguration | undefined;
let lastParsedCommandLine: ConfigFileResponse | undefined;
parentPort.postMessage({ type: "ready" });
await client.serve(async (method, payload) => {
    try {
        if (method !== "lintWork") throw new Error(`Unknown native lint work method "${method}"`);
        const { workId, request }: { workId: number; request: InspectPluginsRequest | NativeLintRequest; } = JSON.parse(payload);
        const shouldCancel = () => Atomics.load(cancellation, 0) === workId;
        if (request.kind === "inspectPlugins") {
            if (shouldCancel()) throw new Error("Lint work cancelled");
            return JSON.stringify({ result: await executeWork(request, [], undefined, shouldCancel) });
        }
        if (request.kind !== "lint" || !request.snapshot || request.snapshot.projects.length !== 1) throw new Error("Lint work requires one native project binding");
        const configuration = request.configuration === "reuse"
            ? lastConfiguration
            : request.configuration;
        if (!configuration) throw new Error("Cannot reuse native lint configuration before receiving one");
        record(configuration, "Native lint configuration");
        const projectBinding = request.snapshot.projects[0];
        const parsedCommandLine = projectBinding.parsedCommandLine === "reuse"
            ? lastParsedCommandLine
            : projectBinding.parsedCommandLine;
        if (!parsedCommandLine) throw new Error("Cannot reuse native parsed command line before receiving one");
        record(parsedCommandLine, "Native parsed command line");
        // Decode and remember configuration before cancellation so both peers
        // agree on the last payload even when this work is skipped.
        lastConfiguration = configuration;
        lastParsedCommandLine = parsedCommandLine;
        if (shouldCancel()) throw new Error("Lint work cancelled");
        const snapshot = api.attachSnapshot({
            ...request.snapshot,
            // API consumers can mutate compiler options; keep the wire cache
            // independent from the project exposed during an individual batch.
            projects: [{ ...projectBinding, parsedCommandLine: structuredClone(parsedCommandLine) }],
        });
        try {
            const project = snapshot.getProjects()[0];
            if (!project) throw new Error("Native lint binding did not contain a project");
            const files = request.files.map(file => {
                const source = project.program.getSourceFile(file.fileName);
                if (!source) throw new Error(`Native lint source file "${file.fileName}" is unavailable`);
                return source;
            });
            return JSON.stringify({ result: await executeWork({ ...configuration, kind: "lint", files: request.files }, files, { api, snapshot, project, program: project.program, checker: project.checker, defaultLibraries: configuration.resolvedLibraries }, shouldCancel) });
        }
        finally {
            snapshot.dispose();
            api.clearSourceFileCache();
        }
    }
    catch (error) {
        return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
    }
});
