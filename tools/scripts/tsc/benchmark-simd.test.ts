import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
    benchmarkPackagePattern,
    benchmarkPattern,
    benchmarks,
    experimentEnvironment,
    main,
    measurementOrder,
    median,
    parseBenchmarks,
    parseResults,
    renderChart,
    type Results,
    workloadBounds,
} from "./benchmark-simd.ts";

function results(original = false): Results {
    const samples = (times: number[]) => Object.fromEntries(benchmarks("checker.ts").map(benchmark => [benchmark.name, [...times]]));
    return {
        version: 1,
        fixture: "checker.ts",
        machine: "test machine",
        revision: "test revision",
        baseline: original ? "baseline revision" : undefined,
        count: 2,
        benchtime: "300ms",
        notes: "test samples",
        variants: [
            ...(original ? [{ name: "original" as const, samples: samples([10, 30]) }] : []),
            { name: "scalar", samples: samples([5, 15]) },
            { name: "simd", samples: samples([2.5, 7.5]) },
        ],
    };
}

test("benchmark parsing keeps decimal samples and removes only the CPU suffix", () => {
    assert.deepEqual(
        parseBenchmarks(`
goos: windows
BenchmarkTextScan/checker.ts/UTF16Len-15 42 123.5 ns/op 0 B/op 0 allocs/op
BenchmarkTextScan/checker.ts/UTF16Len-15 84 1.25e2 ns/op 0 B/op 0 allocs/op
BenchmarkParse/checker-15.ts-8 1 900 ns/op
PASS
`),
        {
            "BenchmarkTextScan/checker.ts/UTF16Len": [123.5, 125],
            "BenchmarkParse/checker-15.ts": [900],
        },
    );
    for (const value of ["0", "-1", "NaN", "Infinity"]) {
        assert.throws(() => parseBenchmarks(`BenchmarkX-1 1 ${value} ns/op`), /Invalid benchmark time/);
    }
});

test("benchmark patterns anchor every path segment and escape fixture metacharacters", () => {
    assert.equal(benchmarkPattern("BenchmarkTextScan/checker.[a]+.ts/UTF16Len"), "^BenchmarkTextScan$/^checker\\.\\[a\\]\\+\\.ts$/^UTF16Len$");
    assert.equal(benchmarkPattern("BenchmarkParse/checker.ts"), "^BenchmarkParse$/^checker\\.ts$");
});

test("median uses numeric ordering without mutating the samples", () => {
    const values = [100, 2, 10, 4];
    assert.equal(median(values), 7);
    assert.deepEqual(values, [100, 2, 10, 4]);
    assert.equal(median([10, 1, 3]), 3);
    for (const values of [[], [0], [-1], [NaN], [Infinity]]) {
        assert.throws(() => median(values), /positive, finite/);
    }
});

test("SIMD experiment selection preserves other experiments and the parent environment", () => {
    const parent = { GOEXPERIMENT: "jsonv2,simd,nosimd", GODEBUG: "simd=128" };
    assert.deepEqual(experimentEnvironment(false, parent), { GOEXPERIMENT: "jsonv2", GODEBUG: "simd=128" });
    assert.deepEqual(experimentEnvironment(true, parent), { GOEXPERIMENT: "jsonv2,simd", GODEBUG: "simd=128" });
    assert.equal(parent.GOEXPERIMENT, "jsonv2,simd,nosimd");
    assert.equal(experimentEnvironment(true, {}).GOEXPERIMENT, "simd");
});

test("six rounds balance all three-build orders and alternate two-build comparisons", () => {
    const orders = Array.from({ length: 6 }, (_, round) => measurementOrder(["original", "scalar", "simd"], round));
    assert.equal(new Set(orders.map(order => order.join())).size, 6);
    for (const name of ["original", "scalar", "simd"]) {
        for (let position = 0; position < 3; position++) {
            assert.equal(orders.filter(order => order[position] === name).length, 2);
        }
    }
    assert.deepEqual(measurementOrder(["scalar", "simd"], 0), ["scalar", "simd"]);
    assert.deepEqual(measurementOrder(["scalar", "simd"], 1), ["simd", "scalar"]);
});

test("default chart isolates SIMD and retains regressions below the reference line", () => {
    const data = results();
    data.variants[1].samples["BenchmarkParse/checker.ts"] = [10, 30];
    const chart = renderChart(data);
    assert.match(chart, /xychart-beta horizontal/);
    assert.match(chart, /Parse only \/ SIMD 0\.50-0\.50x \(1 case\)/);
    assert.match(chart, /y-axis .* 0 --> 3/);
    assert.match(chart, /bar \[2, 2, 2, 2, 0.5, 2\]/);
    assert.match(chart, /line \[1, 1, 1, 1, 1, 1\]/);
    assert.doesNotMatch(chart, /\/ scalar/);
});

test("baseline chart separates scalar optimizations from SIMD using the same reference", () => {
    const chart = renderChart(results(true));
    assert.match(chart, /UTF-16 length \/ scalar 2\.00-2\.00x/);
    assert.match(chart, /UTF-16 length \/ SIMD 4\.00-4\.00x/);
    assert.match(chart, /Parse plus maps \/ SIMD 4\.00-4\.00x/);
    assert.match(chart, /bar \[2, 4, 2, 4, 2, 4, 2, 4, 2, 4, 2, 4\]/);
    assert.match(chart, /line \[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1\]/);
});

test("saved measurements round-trip and reject missing, duplicate, or invalid results", () => {
    const data = results(true);
    assert.deepEqual(parseResults(JSON.stringify(data)), data);
    assert.throws(() => parseResults('{"version":2}'), /Unsupported/);
    const missing = results();
    delete missing.variants[0].samples["BenchmarkParse/checker.ts"];
    assert.throws(() => parseResults(JSON.stringify(missing)), /No sub-benchmarks for Parse only/);
    const count = results();
    count.count = 3;
    assert.throws(() => parseResults(JSON.stringify(count)), /Expected 3 samples/);
    const duplicate = results();
    duplicate.variants.push(duplicate.variants[0]);
    assert.throws(() => parseResults(JSON.stringify(duplicate)), /unique/);
    const invalid = results();
    invalid.variants[0].samples["BenchmarkParse/checker.ts"] = [0, 1];
    assert.throws(() => parseResults(JSON.stringify(invalid)), /Invalid samples/);
    const cpu = results();
    cpu.cpu = 1;
    assert.deepEqual(parseResults(JSON.stringify(cpu)), cpu);
    cpu.cpu = 0;
    assert.throws(() => parseResults(JSON.stringify(cpu)), /positive benchmark CPU/);
});

test("workload bounds pair the same cases and overlay the maximum behind the minimum", () => {
    const data = results(true);
    data.fixture = "all";
    for (const variant of data.variants) {
        const times = variant.name === "original" ? [1000, 1000] : variant.name === "scalar" ? [250, 250] : [2000, 2000];
        for (const benchmark of benchmarks("other.ts")) variant.samples[benchmark.name] = [...times];
        for (const benchmark of benchmarks("empty.ts")) variant.samples[benchmark.name] = variant.name === "original" ? [1e9, 1e9] : [1, 1];
    }
    const bounds = workloadBounds(data);
    assert.deepEqual(bounds[0], {
        label: "UTF-16 length",
        variant: "scalar",
        lower: 2,
        upper: 4,
        lowerCase: "BenchmarkTextScan/checker.ts/UTF16Len",
        upperCase: "BenchmarkTextScan/other.ts/UTF16Len",
        cases: 2,
    });
    assert.deepEqual(bounds[1], {
        label: "UTF-16 length",
        variant: "simd",
        lower: 0.5,
        upper: 4,
        lowerCase: "BenchmarkTextScan/other.ts/UTF16Len",
        upperCase: "BenchmarkTextScan/checker.ts/UTF16Len",
        cases: 2,
    });
    const chart = renderChart(data);
    assert.match(chart, /SIMD 0\.50-4\.00x \(2 cases\)/);
    const bars = chart.split("\n").filter(line => line.startsWith("  bar "));
    assert.deepEqual(bars, [
        "  bar [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]",
        "  bar [2, 0.5, 2, 0.5, 2, 0.5, 2, 0.5, 2, 0.5, 2, 0.5]",
    ]);
    assert.match(chart, /not confidence intervals/);
    assert.match(chart, /plotColorPalette: "#93c5fd,#1d4ed8,#111827"/);
    delete data.variants[1].samples["BenchmarkTextScan/other.ts/UTF16Len"];
    assert.throws(() => workloadBounds(data), /Sub-benchmarks must match/);
});

test("bounds use workload medians, not sample extrema or a ratio of unrelated workloads", () => {
    const data = results();
    data.count = 3;
    for (const variant of data.variants) {
        const times = variant.name === "scalar" ? [1, 100, 1000] : [1, 50, 1000];
        for (const benchmark of benchmarks(data.fixture)) variant.samples[benchmark.name] = [...times];
    }
    for (const bound of workloadBounds(data)) {
        assert.equal(bound.lower, 2);
        assert.equal(bound.upper, 2);
    }
});

test("package selectors collect entire families or an explicitly filtered case", () => {
    assert.equal(benchmarkPackagePattern("core", "all"), "^(BenchmarkTextScan)$");
    assert.equal(benchmarkPackagePattern("parser", "all"), "^(BenchmarkParse|BenchmarkParseWithPositionMaps)$");
    assert.equal(benchmarkPackagePattern("core", "checker.ts"), "^(BenchmarkTextScan)$/^checker\\.ts$");
    assert.throws(() => benchmarkPackagePattern("unknown", "all"), /Unknown benchmark package/);
});

test("CLI regenerates a chart from saved measurements without Go and preserves unrelated output files", async context => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tsgo-simd-chart-test-"));
    context.after(() => fs.rmSync(directory, { recursive: true, force: true, maxRetries: 10 }));
    const input = path.join(directory, "input.json");
    const untouched = path.join(directory, "untouched.txt");
    fs.writeFileSync(input, JSON.stringify(results(true)));
    fs.writeFileSync(untouched, "keep");
    await main(["--from", input, "--out", directory]);
    assert.equal(fs.readFileSync(path.join(directory, "chart.mmd"), "utf8"), renderChart(results(true)));
    assert.deepEqual(parseResults(fs.readFileSync(path.join(directory, "results.json"), "utf8")), results(true));
    assert.equal(fs.readFileSync(untouched, "utf8"), "keep");
    await assert.rejects(main(["--from", input, "--count", "1"]), /cannot be combined/);
    await assert.rejects(main(["--from", input, "--cpu", "1"]), /cannot be combined/);
});

test("CLI rejects invalid sampling options before invoking Go", async () => {
    for (const count of ["0", "-1", "1.5", "NaN"]) {
        await assert.rejects(main([`--count=${count}`]), /positive integer/);
    }
    for (const cpu of ["0", "-1", "1.5", "NaN"]) {
        await assert.rejects(main([`--cpu=${cpu}`]), /positive integer/);
    }
    for (const benchtime of ["0ms", "0.0s", ".0s", "0h0m0s", "-1s", "0x", "garbage"]) {
        await assert.rejects(main([`--benchtime=${benchtime}`]), /positive Go duration/);
    }
    await assert.rejects(main(["--fixture", "nested/file.ts"]), /single benchmark fixture/);
    await assert.rejects(main(["--unknown"]), /Unknown option/);
});
