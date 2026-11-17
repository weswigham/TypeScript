//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypesDeclareConstValuePromiseBooleanBooleanIfValue.ts] ////

//// [input.ts]
declare const value: Promise<boolean> | boolean; if (value) {}
export {};

//// [input.ts]
declare const value: Promise<boolean> | boolean; if (value) {}
export {};
