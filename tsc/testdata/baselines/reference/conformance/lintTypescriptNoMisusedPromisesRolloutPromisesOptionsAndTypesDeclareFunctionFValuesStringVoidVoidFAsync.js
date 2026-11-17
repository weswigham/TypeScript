//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypesDeclareFunctionFValuesStringVoidVoidFAsync.ts] ////

//// [input.ts]
declare function f(...values: [string, () => void]): void; f('', async () => {});
export {};

//// [input.ts]
declare function f(...values: [string, () => void]): void; f('', async () => {});
export {};
