import {
    API as AsyncAPI,
    type Project as AsyncProject,
} from "@typescript/typescript/unstable/async";
import {
    API as SyncAPI,
    type Project as SyncProject,
} from "@typescript/typescript/unstable/sync";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Bench } from "tinybench";
import ts from "typescript";

const requestCount = 128;
const flightCount = 8;
const requestsPerFlight = requestCount / flightCount;

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    const { values } = parseArgs({
        options: {
            filter: { type: "string" },
            singleIteration: { type: "boolean", default: false },
        },
    });
    await runBenchmarks(values);
}

export async function runBenchmarks(options?: { filter?: string; singleIteration?: boolean; }) {
    const { filter, singleIteration } = options ?? {};
    const repoRoot = fileURLToPath(new URL("../../../", import.meta.url).toString());
    const fixturePath = fileURLToPath(new URL("../../../tsc/testdata/fixtures/compiler/program.ts", import.meta.url).toString());
    const positions = collectIdentifierPositions(fixturePath, requestCount);
    const bench = new Bench({
        name: "API comparison",
        iterations: 10,
        warmupIterations: 4,
        ...singleIteration ? {
            iterations: 1,
            warmup: false,
            time: 0,
        } : undefined,
    });

    addSyncBenchmarks();
    addAsyncBenchmarks();
    addGeneratorBenchmarks();

    if (filter) {
        const pattern = filter.toLowerCase();
        for (const task of [...bench.tasks]) {
            if (!task.name.toLowerCase().includes(pattern)) {
                bench.remove(task.name);
            }
        }
    }

    await bench.run();
    console.table(bench.table());

    function addSyncBenchmarks() {
        addSyncTask("dependent sequential requests", context => {
            let index = 0;
            for (let request = 0; request < requestCount; request++) {
                const symbol = context.project.checker.getSymbolAtPosition("program.ts", positions[index]);
                index = nextPositionIndex(index, symbol?.flags ?? 0);
            }
        });
        addSyncTask("independent parallel requests", context => {
            for (const position of positions) {
                context.project.checker.getSymbolAtPosition("program.ts", position);
            }
        });
        addSyncTask("multiple flights of independent requests", context => {
            for (let flight = 0; flight < flightCount; flight++) {
                const start = flight * requestsPerFlight;
                for (let request = 0; request < requestsPerFlight; request++) {
                    context.project.checker.getSymbolAtPosition("program.ts", positions[start + request]);
                }
            }
        });
    }

    function addAsyncBenchmarks() {
        addAsyncTask("dependent sequential requests", async context => {
            let index = 0;
            for (let request = 0; request < requestCount; request++) {
                const symbol = await context.project.checker.getSymbolAtPosition("program.ts", positions[index]);
                index = nextPositionIndex(index, symbol?.flags ?? 0);
            }
        });
        addAsyncTask("independent parallel requests", async context => {
            await Promise.all(positions.map(position => context.project.checker.getSymbolAtPosition("program.ts", position)));
        });
        addAsyncTask("multiple flights of independent requests", async context => {
            for (let flight = 0; flight < flightCount; flight++) {
                const start = flight * requestsPerFlight;
                await Promise.all(positions.slice(start, start + requestsPerFlight).map(position => context.project.checker.getSymbolAtPosition("program.ts", position)));
            }
        });
    }

    function addGeneratorBenchmarks() {
        addGeneratorTask("dependent sequential requests", context => {
            context.api.batch(runDependentRequests(context.project));
        });
        addGeneratorTask("independent parallel requests", context => {
            context.api.batch(...positions.map(position => context.project.checker.getSymbolAtPosition.gen("program.ts", position)));
        });
        addGeneratorTask("multiple flights of independent requests", context => {
            context.api.batch(...Array.from({ length: requestsPerFlight }, (_, lane) => runRequestLane(context.project, lane)));
        });
    }

    function* runDependentRequests(project: SyncProject) {
        let index = 0;
        for (let request = 0; request < requestCount; request++) {
            const symbol = yield* project.checker.getSymbolAtPosition.gen("program.ts", positions[index]);
            index = nextPositionIndex(index, symbol?.flags ?? 0);
        }
    }

    function* runRequestLane(project: SyncProject, lane: number) {
        for (let flight = 0; flight < flightCount; flight++) {
            yield* project.checker.getSymbolAtPosition.gen("program.ts", positions[flight * requestsPerFlight + lane]);
        }
    }

    function nextPositionIndex(index: number, symbolFlags: number): number {
        return (index + symbolFlags + 1) % positions.length;
    }

    function addSyncTask(name: string, run: (context: SyncContext) => void) {
        let context: SyncContext;
        bench.add(`sync - ${name}`, () => run(context), {
            async: false,
            beforeAll: () => {
                context = createSyncContext();
            },
            afterAll: () => context.api.close(),
        });
    }

    function addAsyncTask(name: string, run: (context: AsyncContext) => Promise<void>) {
        let context: AsyncContext;
        bench.add(`async - ${name}`, () => run(context), {
            async: true,
            beforeAll: async () => {
                context = await createAsyncContext();
            },
            afterAll: async () => context.api.close(),
        });
    }

    function addGeneratorTask(name: string, run: (context: SyncContext) => void) {
        let context: SyncContext;
        bench.add(`generators - ${name}`, () => run(context), {
            async: false,
            beforeAll: () => {
                context = createGeneratorContext();
            },
            afterAll: () => context.api.close(),
        });
    }

    function createSyncContext(): SyncContext {
        const api = new SyncAPI({ cwd: repoRoot });
        const snapshot = api.updateSnapshot({ openProject: "tsc/testdata/fixtures/compiler/tsconfig.json" });
        const project = snapshot.getProjects()[0];
        project.checker.getSymbolAtPosition("core.ts", 0);
        return { api, project };
    }

    async function createAsyncContext(): Promise<AsyncContext> {
        const api = new AsyncAPI({ cwd: repoRoot });
        const snapshot = await api.updateSnapshot({ openProject: "tsc/testdata/fixtures/compiler/tsconfig.json" });
        const project = snapshot.getProjects()[0];
        await project.checker.getSymbolAtPosition("core.ts", 0);
        return { api, project };
    }

    function createGeneratorContext(): SyncContext {
        const api = new SyncAPI({ cwd: repoRoot });
        const [snapshot] = api.batch(api.updateSnapshot.gen({ openProject: "tsc/testdata/fixtures/compiler/tsconfig.json" }));
        const project = snapshot.getProjects()[0];
        api.batch(project.checker.getSymbolAtPosition.gen("core.ts", 0));
        return { api, project };
    }
}

interface SyncContext {
    api: SyncAPI;
    project: SyncProject;
}

interface AsyncContext {
    api: AsyncAPI;
    project: AsyncProject;
}

function collectIdentifierPositions(fileName: string, count: number): number[] {
    const sourceFile = ts.createSourceFile(fileName, readFileSync(fileName, "utf8"), ts.ScriptTarget.Latest, true);
    const positions: number[] = [];
    sourceFile.forEachChild(function visit(node) {
        if (node.kind === ts.SyntaxKind.Identifier) {
            positions.push(node.pos);
        }
        node.forEachChild(visit);
    });
    if (positions.length < count) {
        throw new Error(`Expected at least ${count} identifiers in ${fileName}, found ${positions.length}`);
    }
    return Array.from({ length: count }, (_, index) => positions[Math.floor(index * positions.length / count)]);
}
