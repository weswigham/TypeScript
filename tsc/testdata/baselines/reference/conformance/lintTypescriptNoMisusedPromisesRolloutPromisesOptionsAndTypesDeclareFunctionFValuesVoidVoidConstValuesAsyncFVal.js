//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypesDeclareFunctionFValuesVoidVoidConstValuesAsyncFVal.ts] ////

//// [input.ts]
declare function f(...values: (() => void)[]): void; const values = [async () => {}]; f(...values);
export {};

//// [input.ts]
declare function f(...values: (() => void)[]): void; const values = [async () => {}]; f(...values);
export {};
