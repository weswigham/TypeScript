import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
    repoRoot,
    run,
} from "../gen/utils.mts";

type VariantName = "original" | "scalar" | "simd";

export interface Results {
    version: 1;
    fixture: string;
    machine: string;
    revision: string;
    baseline?: string;
    count: number;
    cpu?: number;
    benchtime: string;
    notes: string;
    variants: {
        name: VariantName;
        samples: Record<string, number[]>;
    }[];
}

const operations = [
    { label: "UTF-16 length", pkg: "core", root: "BenchmarkTextScan", leaf: "UTF16Len" },
    { label: "Line starts", pkg: "core", root: "BenchmarkTextScan", leaf: "LineStarts" },
    { label: "Position map", pkg: "ast", root: "BenchmarkPositionMapScan", leaf: "" },
    { label: "String escaping", pkg: "printer", root: "BenchmarkEscapeScan", leaf: "" },
    { label: "Parse only", pkg: "parser", root: "BenchmarkParse", leaf: "" },
    { label: "Parse plus maps", pkg: "parser", root: "BenchmarkParseWithPositionMaps", leaf: "" },
];

export function benchmarks(fixture: string) {
    return operations.map(operation => ({
        label: operation.label,
        pkg: operation.pkg,
        name: [operation.root, fixture, ...(operation.leaf ? [operation.leaf] : [])].join("/"),
    }));
}

function subBenchmarkCase(name: string, operation: typeof operations[number]): string | undefined {
    const parts = name.split("/");
    if (parts[0] !== operation.root || parts.length !== (operation.leaf ? 3 : 2) || operation.leaf && parts[2] !== operation.leaf) return undefined;
    return parts[1];
}

function selectedNames(samples: Record<string, number[]>, fixture: string): string[] {
    return Object.keys(samples).filter(name =>
        operations.some(operation => {
            const nameOfCase = subBenchmarkCase(name, operation);
            return nameOfCase !== undefined && (fixture === "all" ? nameOfCase !== "empty.ts" : nameOfCase === fixture);
        })
    ).sort();
}

export function benchmarkPackagePattern(pkg: string, fixture: string): string {
    const roots = [...new Set(operations.filter(operation => operation.pkg === pkg).map(operation => operation.root))];
    assert(roots.length > 0, `Unknown benchmark package: ${pkg}`);
    return `^(${roots.join("|")})$` + (fixture === "all" ? "" : "/" + benchmarkPattern(fixture));
}

export function benchmarkPattern(name: string): string {
    return name.split("/").map(part => `^${part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`).join("/");
}

export function parseBenchmarks(text: string): Record<string, number[]> {
    const samples: Record<string, number[]> = {};
    for (const line of text.split(/\r?\n/)) {
        const match = /^(Benchmark\S+)\s+\d+\s+(\S+)\s+ns\/op(?:\s|$)/.exec(line);
        if (!match) continue;
        const time = Number(match[2]);
        assert(Number.isFinite(time) && time > 0, `Invalid benchmark time: ${line}`);
        const name = match[1].replace(/-\d+$/, "");
        (samples[name] ??= []).push(time);
    }
    return samples;
}

export function median(values: readonly number[]): number {
    assert(values.length > 0 && values.every(value => Number.isFinite(value) && value > 0), "Expected positive, finite benchmark samples");
    const sorted = [...values].sort((a, b) => a - b);
    const middle = sorted.length >> 1;
    return sorted.length % 2 ? sorted[middle] : sorted[middle - 1] / 2 + sorted[middle] / 2;
}

export function experimentEnvironment(enabled: boolean, environment: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
    const experiments = (environment.GOEXPERIMENT ?? "").split(",").filter(value => value && value !== "simd" && value !== "nosimd");
    if (enabled) experiments.push("simd");
    return { ...environment, GOEXPERIMENT: experiments.join(",") };
}

export function measurementOrder(names: readonly VariantName[], round: number): VariantName[] {
    const order = [...names];
    if (names.length === 3 && Math.floor(round / names.length) % 2) order.reverse();
    const offset = round % names.length;
    return [...order.slice(offset), ...order.slice(0, offset)];
}

function validateResults(results: Results): void {
    assert(results.fixture && !/[/\\\r\n]/.test(results.fixture), "Expected a single benchmark fixture name");
    assert(Number.isSafeInteger(results.count) && results.count > 0, "Expected a positive sample count");
    assert(results.cpu === undefined || Number.isSafeInteger(results.cpu) && results.cpu > 0, "Expected a positive benchmark CPU count");
    const names = results.variants.map(variant => variant.name);
    assert(new Set(names).size === names.length && names.includes("scalar") && names.includes("simd"), "Expected unique scalar and simd variants");
    assert(names.length === 2 || names.length === 3 && names.includes("original"), "Unexpected benchmark variants");
    assert(names.includes("original") === !!results.baseline, "An original variant requires its baseline Git revision");
    const expected = selectedNames(results.variants[0].samples, results.fixture);
    for (const operation of operations) {
        assert(expected.some(name => subBenchmarkCase(name, operation) !== undefined), `No sub-benchmarks for ${operation.label}; check that the fixture exists and was not skipped`);
    }
    for (const variant of results.variants) {
        assert.deepEqual(selectedNames(variant.samples, results.fixture), expected, `Sub-benchmarks must match across variants: ${variant.name}`);
        for (const name of expected) {
            const values = variant.samples[name];
            assert(values?.length === results.count, `Expected ${results.count} samples for ${variant.name}: ${name}; check that the fixture exists and was not skipped`);
            median(values);
        }
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseResults(text: string): Results {
    const data: unknown = JSON.parse(text);
    assert(isRecord(data) && data.version === 1, "Unsupported benchmark results format");
    assert(typeof data.fixture === "string" && typeof data.machine === "string" && typeof data.revision === "string", "Invalid benchmark metadata");
    assert(typeof data.count === "number" && typeof data.benchtime === "string" && typeof data.notes === "string", "Invalid benchmark sampling metadata");
    assert(data.cpu === undefined || typeof data.cpu === "number", "Invalid benchmark CPU count");
    assert(data.baseline === undefined || typeof data.baseline === "string", "Invalid baseline revision");
    assert(Array.isArray(data.variants), "Missing benchmark variants");
    const results: Results = {
        version: 1,
        fixture: data.fixture,
        machine: data.machine,
        revision: data.revision,
        baseline: data.baseline,
        count: data.count,
        ...(data.cpu !== undefined ? { cpu: data.cpu } : {}),
        benchtime: data.benchtime,
        notes: data.notes,
        variants: data.variants.map((value: unknown) => {
            assert(isRecord(value) && (value.name === "original" || value.name === "scalar" || value.name === "simd"), "Invalid benchmark variant");
            assert(isRecord(value.samples), "Missing benchmark samples");
            return {
                name: value.name,
                samples: Object.fromEntries(
                    Object.entries(value.samples).map(([name, times]): [string, number[]] => {
                        assert(Array.isArray(times) && times.every(time => typeof time === "number" && Number.isFinite(time) && time > 0), `Invalid samples: ${name}`);
                        return [name, times.map(Number)];
                    }),
                ),
            };
        }),
    };
    validateResults(results);
    return results;
}

export function workloadBounds(results: Results) {
    validateResults(results);
    const reference = results.variants.find(variant => variant.name === (results.baseline ? "original" : "scalar"))!;
    const comparisons: VariantName[] = results.baseline ? ["scalar", "simd"] : ["simd"];
    const names = selectedNames(reference.samples, results.fixture);
    return operations.flatMap(operation => {
        const cases = names.filter(name => subBenchmarkCase(name, operation) !== undefined);
        return comparisons.map(name => {
            const variant = results.variants.find(variant => variant.name === name)!;
            const ratios = cases.map(benchmark => {
                const ratio = median(reference.samples[benchmark]) / median(variant.samples[benchmark]);
                assert(Number.isFinite(ratio) && ratio > 0, `Invalid speedup: ${benchmark}`);
                return { name: benchmark, ratio };
            });
            const lower = ratios.reduce((a, b) => a.ratio <= b.ratio ? a : b);
            const upper = ratios.reduce((a, b) => a.ratio >= b.ratio ? a : b);
            return { label: operation.label, variant: name, lower: lower.ratio, upper: upper.ratio, lowerCase: lower.name, upperCase: upper.name, cases: cases.length };
        });
    });
}

export function renderChart(results: Results): string {
    const bounds = workloadBounds(results);
    const labels = bounds.map(bound => `${bound.label} / ${bound.variant === "simd" ? "SIMD" : "scalar"} ${bound.lower.toFixed(2)}-${bound.upper.toFixed(2)}x (${bound.cases} case${bound.cases === 1 ? "" : "s"})`);
    const maximum = Math.max(2, Math.ceil(Math.max(...bounds.map(bound => bound.upper)) * 1.1));
    assert(Number.isFinite(maximum), "Chart scale overflow");
    const comment = (text: string) => `%% ${text.replace(/[\r\n]/g, " ")}`;
    return [
        "---",
        "config:",
        "  xyChart:",
        "    width: 1200",
        `    height: ${results.baseline ? 650 : 450}`,
        "  themeVariables:",
        "    xyChart:",
        '      plotColorPalette: "#93c5fd,#1d4ed8,#111827"',
        "---",
        comment(results.machine),
        comment(`Revision: ${results.revision}; baseline: ${results.baseline ?? "current scalar code"}`),
        comment(`Medians of ${results.count} samples per sub-benchmark; benchtime: ${results.benchtime}.`),
        comment("Bounds are workload minima/maxima, not confidence intervals. Solid = lower; pale extension = upper."),
        comment(results.notes),
        ...bounds.map(bound => comment(`${bound.label}/${bound.variant}: lower ${bound.lowerCase}; upper ${bound.upperCase}`)),
        "xychart-beta horizontal",
        `  title ${JSON.stringify(`Throughput bounds: ${results.fixture} (vs ${results.baseline ? "original" : "scalar"}); solid=min, pale=max`)}`,
        `  x-axis [${labels.map(label => JSON.stringify(label)).join(", ")}]`,
        `  y-axis "Relative throughput (higher is better)" 0 --> ${maximum}`,
        // Mermaid overlays bar series: draw the maximum first, then the solid minimum.
        `  bar [${bounds.map(bound => Number(bound.upper.toPrecision(6))).join(", ")}]`,
        `  bar [${bounds.map(bound => Number(bound.lower.toPrecision(6))).join(", ")}]`,
        `  line [${bounds.map(() => 1).join(", ")}]`,
        "",
    ].join("\n");
}

async function measure(fixture: string, count: number, benchtime: string, baseline: string | undefined, output: string, cpu: number | undefined): Promise<Results> {
    const packages = [...new Set(operations.map(operation => operation.pkg))];
    const names: VariantName[] = baseline ? ["original", "scalar", "simd"] : ["scalar", "simd"];
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "tsgo-simd-"));
    const command = (name: string, args: string[], simd: boolean, benchmark = false) =>
        run(name, args, {
            cwd: repoRoot,
            env: { ...experimentEnvironment(simd), ...(benchmark && cpu !== undefined ? { GOMAXPROCS: String(cpu) } : {}) },
            captureOutput: true,
        });
    try {
        const revision = (await command("git", ["rev-parse", "HEAD"], false)).stdout.trim();
        const dirty = (await command("git", ["status", "--short"], false)).stdout.trim();
        const baselineRevision = baseline
            ? (await command("git", ["rev-parse", "--verify", "--end-of-options", `${baseline}^{commit}`], false)).stdout.trim()
            : undefined;
        const overlay = path.join(temporary, "baseline.json");
        if (baselineRevision) {
            // Keep the current test harness and toolchain; replace only the production
            // implementations changed by the SIMD optimization, not whole old packages.
            const files = ["tsc/internal/core/core.go", "tsc/internal/ast/positionmap.go", "tsc/internal/printer/utilities.go"];
            const replacements: Record<string, string> = {};
            for (const [index, file] of files.entries()) {
                const copy = path.join(temporary, `baseline-${index}.go`);
                fs.writeFileSync(copy, (await command("git", ["show", `${baselineRevision}:${file}`], false)).stdout);
                replacements[path.join(repoRoot, ...file.split("/"))] = copy;
            }
            fs.writeFileSync(overlay, JSON.stringify({ Replace: replacements }));
        }
        const info = path.join(temporary, "info.go");
        fs.writeFileSync(
            info,
            `package main
import ("fmt"; "runtime"; "simd")
func main() {
    fmt.Printf("%s %s/%s, SIMD %d-bit (emulated=%t), GOMAXPROCS=%d",
        runtime.Version(), runtime.GOOS, runtime.GOARCH, simd.VectorBitSize(), simd.Emulated(), runtime.GOMAXPROCS(0))
}
`,
        );
        const machine = (await command("go", ["run", info], true, true)).stdout.trim();
        console.log(machine);
        const binaries = new Map<string, string>();
        for (const name of names) {
            for (const pkg of packages) {
                const binary = path.join(temporary, `${name}-${pkg}.test${process.platform === "win32" ? ".exe" : ""}`);
                await command("go", [
                    "-C",
                    "tsc",
                    "test",
                    "-c",
                    ...(name === "original" ? ["-overlay", overlay] : []),
                    "-o",
                    binary,
                    `.${path.sep}internal${path.sep}${pkg}`,
                ], name === "simd");
                binaries.set(`${name}-${pkg}`, binary);
            }
        }
        const results: Results = {
            version: 1,
            fixture,
            machine,
            revision: revision + (dirty ? " (dirty)" : ""),
            baseline: baselineRevision,
            count,
            ...(cpu !== undefined ? { cpu } : {}),
            benchtime,
            notes: "Packages run sequentially and build order rotates. Bounds span matched sub-benchmark median ratios; empty.ts is excluded in all-workload mode. These are workload ranges, not confidence intervals.",
            variants: names.map(name => ({ name, samples: {} })),
        };
        for (const name of names) fs.writeFileSync(path.join(output, `${name}.txt`), "");
        for (let round = 0; round < count; round++) {
            for (const name of measurementOrder(names, round)) {
                console.log(`Sample ${round + 1}/${count}: ${name}`);
                const variant = results.variants.find(variant => variant.name === name)!;
                for (const pkg of packages) {
                    const { stdout } = await command(
                        binaries.get(`${name}-${pkg}`)!,
                        [
                            "-test.run=^$",
                            `-test.bench=${benchmarkPackagePattern(pkg, fixture)}`,
                            `-test.benchtime=${benchtime}`,
                            "-test.count=1",
                            "-test.benchmem",
                            ...(cpu !== undefined ? [`-test.cpu=${cpu}`] : []),
                        ],
                        name === "simd",
                        true,
                    );
                    fs.appendFileSync(path.join(output, `${name}.txt`), stdout);
                    const samples = parseBenchmarks(stdout);
                    for (const benchmark of selectedNames(samples, fixture)) {
                        const times = samples[benchmark];
                        assert(times.length === 1, `Expected one result for ${benchmark}`);
                        (variant.samples[benchmark] ??= []).push(times[0]);
                    }
                }
            }
        }
        return results;
    }
    finally {
        fs.rmSync(temporary, { recursive: true, force: true, maxRetries: 10 });
    }
}

export async function main(args = process.argv.slice(2)): Promise<void> {
    const { values } = parseArgs({
        args,
        options: {
            baseline: { type: "string" },
            fixture: { type: "string" },
            count: { type: "string" },
            cpu: { type: "string" },
            benchtime: { type: "string" },
            from: { type: "string" },
            out: { type: "string" },
            help: { type: "boolean" },
        },
    });
    if (values.help) {
        console.log(`Usage: node tools/scripts/tsc/benchmark-simd.ts [options]

  --fixture NAME     Filter to one case, or all nonempty sub-benchmarks (default: all)
  --count N          Samples per operation/build (default: 6)
  --cpu N            Benchmark GOMAXPROCS (default: caller's setting; Rust comparison uses 1)
  --benchtime TIME   Go benchmark duration or iterations (default: 300ms)
  --baseline REF     Also compare the three original production files from REF
  --from FILE        Rebuild a chart from saved results.json, without running Go
  --out DIRECTORY    Output directory (default: built/local/simd-benchmarks)

Outputs chart.mmd, results.json, and raw Go benchmark logs. Bars show minimum
and maximum per-case median speedups: solid=min, pale extension=max, not a sum
or a confidence interval. Default comparisons isolate SIMD from current scalar
code. --baseline also plots scalar optimizations against that Git revision.
All builds finish before measurements, and sample order rotates between builds.
Use an idle machine. Small ratios are not evidence of statistical significance.

Examples:
  node tools/scripts/tsc/benchmark-simd.ts
  node tools/scripts/tsc/benchmark-simd.ts --baseline <commit-before-SIMD>
  node tools/scripts/tsc/benchmark-simd.ts --from saved-results.json`);
        return;
    }
    const output = path.resolve(values.out ?? path.join(repoRoot, "built", "local", "simd-benchmarks"));
    let results: Results;
    if (values.from) {
        assert(!values.baseline && !values.fixture && !values.count && !values.benchtime && !values.cpu, "--from cannot be combined with benchmark options");
        results = parseResults(fs.readFileSync(values.from, "utf8"));
        fs.mkdirSync(output, { recursive: true });
    }
    else {
        const fixture = values.fixture ?? "all";
        const count = Number(values.count ?? 6);
        const cpu = values.cpu === undefined ? undefined : Number(values.cpu);
        const benchtime = values.benchtime ?? "300ms";
        assert(fixture && !/[/\\\r\n]/.test(fixture), "Expected a single benchmark fixture name");
        assert(Number.isSafeInteger(count) && count > 0, "--count must be a positive integer");
        assert(cpu === undefined || Number.isSafeInteger(cpu) && cpu > 0, "--cpu must be a positive integer");
        assert(/^(?:[1-9]\d*x|(?=.*[1-9])(?:(?:\d+(?:\.\d*)?|\.\d+)(?:ns|us|\u00b5s|\u03bcs|ms|s|m|h))+)$/.test(benchtime), "--benchtime must be a positive Go duration or iteration count");
        fs.mkdirSync(output, { recursive: true });
        results = await measure(fixture, count, benchtime, values.baseline, output, cpu);
    }
    const chart = renderChart(results);
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, undefined, 2) + "\n");
    fs.writeFileSync(path.join(output, "chart.mmd"), chart);
    console.log(`Saved ${path.join(output, "chart.mmd")} and ${path.join(output, "results.json")}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await main();
}
