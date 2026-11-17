//// [tests/cases/conformance/lint/rules/no-floating-promises/lintTypescriptNoFloatingPromisesRolloutPromisesOptionsAndTypesTypeSafePromiseNumberBrandTrueDeclareConstValueSa.ts] ////

//// [input.ts]
type Safe = Promise<number> & { brand: true }; declare const value: Safe; value;
export {};

//// [input.ts]
type Safe = Promise<number> & { brand: true }; declare const value: Safe; value;
export {};
