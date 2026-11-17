//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeFlowArrayRest.ts] ////

//// [input.ts]
declare const value: any; declare function take(...x: string[]): void; take('a', value);

//// [input.ts]
declare const value: any; declare function take(...x: string[]): void; take('a', value);
