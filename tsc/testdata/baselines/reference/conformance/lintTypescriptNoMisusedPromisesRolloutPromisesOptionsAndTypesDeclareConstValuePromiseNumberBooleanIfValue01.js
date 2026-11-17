//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypesDeclareConstValuePromiseNumberBooleanIfValue01.ts] ////

//// [input.ts]
declare const value: Promise<number> | boolean; if (value) {}
export {};

//// [input.ts]
declare const value: Promise<number> | boolean; if (value) {}
export {};
