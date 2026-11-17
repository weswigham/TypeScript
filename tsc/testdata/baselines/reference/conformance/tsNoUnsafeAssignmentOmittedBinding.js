//// [tests/cases/conformance/lint/rules/no-unsafe-assignment/tsNoUnsafeAssignmentOmittedBinding.ts] ////

//// [input.ts]
declare const tuple: [number, any];
const [, value] = tuple;

//// [input.ts]
declare const tuple: [number, any];
const [, value] = tuple;
