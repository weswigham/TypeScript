//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeFlowEmptyMap.ts] ////

//// [input.ts]
declare function take(x: Map<string, string>): void; take(new Map());

//// [input.ts]
declare function take(x: Map<string, string>): void; take(new Map());
