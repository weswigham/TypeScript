//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypesDeclareConstValuePromiseBooleanUndefinedIfValue.ts] ////

//// [input.ts]
declare const value: Promise<boolean> | undefined; if (value) {}
export {};

//// [input.ts]
declare const value: Promise<boolean> | undefined; if (value) {}
export {};
