//// [tests/cases/conformance/lint/rules/no-use-before-define/tsNoUseBeforeDefineCoverage.ts] ////

//// [input.ts]
run();
function run(): number {
    return 1;
}

export function readLater(): number {
    return later;
}
const later = 2;

export type Earlier = Later;
type Later = number;

const ready = 3;
export function readReady(): number {
    return ready;
}
run();

//// [input.ts]
run();
function run(): number {
    return 1;
}

export function readLater(): number {
    return later;
}
const later = 2;

export type Earlier = Later;
type Later = number;

const ready = 3;
export function readReady(): number {
    return ready;
}
run();
