//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypesDeclareFunctionFValueVoidVoidDeclareFunctionFValue.ts] ////

//// [input.ts]
declare function f(value: () => void): void; declare function f(value: () => Promise<void>): void; f(async () => {});
export {};

//// [input.ts]
declare function f(value: () => void): void; declare function f(value: () => Promise<void>): void; f(async () => {});
export {};
