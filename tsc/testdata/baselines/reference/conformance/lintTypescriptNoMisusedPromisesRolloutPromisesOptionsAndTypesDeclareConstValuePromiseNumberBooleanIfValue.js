//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypesDeclareConstValuePromiseNumberBooleanIfValue.ts] ////

//// [input.ts]
declare const value: Promise<number> | boolean; if (value) {}
export {};

//// [input.ts]
declare const value: Promise<number> | boolean; if (value) {}
export {};
