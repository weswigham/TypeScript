//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeFlowSpreadGenericRest.ts] ////

//// [input.ts]
declare function take(...x: [string, string]): void; declare const values: [string, ...string[]]; take(...values, 1 as any);

//// [input.ts]
declare function take(...x: [string, string]): void; declare const values: [string, ...string[]]; take(...values, 1 as any);
