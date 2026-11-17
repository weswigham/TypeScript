//// [tests/cases/conformance/lint/rules/no-useless-default-assignment/tsNoUselessDefaultAssignmentCoverage.ts] ////

//// [input.ts]
const { value = 0 } = { value: 1 };

function required({ value = 0 }: { value: number }): number {
    return value;
}
function optional({ value = 0 }: { value?: number }): number {
    return value;
}

[1, 2].map((value = 1) => value);

declare const tuple: [number, ...number[]];
const [head = 1, tail = 2] = tuple;

declare const values: number[];
const [first = 1] = values;
const callback = (value: number = 1) => value;

//// [input.ts]
const { value = 0 } = { value: 1 };

function required({ value = 0 }: { value: number }): number {
    return value;
}
function optional({ value = 0 }: { value?: number }): number {
    return value;
}

[1, 2].map((value = 1) => value);

declare const tuple: [number, ...number[]];
const [head = 1, tail = 2] = tuple;

declare const values: number[];
const [first = 1] = values;
const callback = (value: number = 1) => value;
