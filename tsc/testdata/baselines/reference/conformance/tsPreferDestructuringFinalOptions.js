//// [tests/cases/conformance/lint/rules/prefer-destructuring/tsPreferDestructuringFinalOptions.ts] ////

//// [input.ts]
declare const source: { value: number };
declare const values: number[];
const annotated: number = source.value;
const renamed = source.value;
const first = values[0];
let destination: number;
destination = values[0];
destination = source.value;

//// [input.ts]
declare const source: { value: number };
declare const values: number[];
const annotated: number = source.value;
const renamed = source.value;
const first = values[0];
let destination: number;
destination = values[0];
destination = source.value;
