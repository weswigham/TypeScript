//// [tests/cases/conformance/lint/rules/prefer-destructuring/tsPreferDestructuringFinalDefaults.ts] ////

//// [input.ts]
declare const source: { value: number; other: number };
declare const values: number[];
declare const indexed: { 0: number };
const value = source.value;
const renamed = source.other;
const annotated: number = source.value;
const first = values[0];
const indexedFirst = indexed[0];
const other /* preserved */ = source.other;

//// [input.ts]
declare const source: { value: number; other: number };
declare const values: number[];
declare const indexed: { 0: number };
const {value} = source;
const renamed = source.other;
const annotated: number = source.value;
const first = values[0];
const indexedFirst = indexed[0];
const other /* preserved */ = source.other;
