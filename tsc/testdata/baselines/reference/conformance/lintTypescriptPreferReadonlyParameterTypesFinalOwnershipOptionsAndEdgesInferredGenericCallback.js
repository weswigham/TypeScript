//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesFinalOwnershipOptionsAndEdgesInferredGenericCallback.ts] ////

//// [input.ts]
declare function f<T>(callback: (arg: T) => void): void; f<string[]>(arg => {});

//// [input.ts]
declare function f<T>(callback: (arg: T) => void): void; f<string[]>(arg => {});
