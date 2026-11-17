//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeFlowAnySpread.ts] ////

//// [input.ts]
declare function take(...x: any[]): void; take(...([] as any));

//// [input.ts]
declare function take(...x: any[]): void; take(...([] as any));
