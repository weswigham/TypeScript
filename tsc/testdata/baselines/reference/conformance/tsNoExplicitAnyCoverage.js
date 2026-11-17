//// [tests/cases/conformance/lint/rules/no-explicit-any/tsNoExplicitAnyCoverage.ts] ////

//// [input.ts]
let value: any;
let values: any[];
type Key = keyof any;

let safeValue: unknown;
let safeValues: unknown[];
function collect(...args: readonly any[]) {
    return args.length;
}

//// [input.ts]
let value: unknown;
let values: unknown[];
type Key = PropertyKey;

let safeValue: unknown;
let safeValues: unknown[];
function collect(...args: readonly any[]) {
    return args.length;
}
