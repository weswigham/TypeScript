//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypesDeclareFunctionFValuesVoidVoidFAsync.ts] ////

//// [input.ts]
declare function f(...values: (() => void)[]): void; f(async () => {});
export {};

//// [input.ts]
declare function f(...values: (() => void)[]): void; f(async () => {});
export {};
