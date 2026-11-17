//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeFlowGenericVariance.ts] ////

//// [input.ts]
declare function take(x: ReadonlySet<string>): void; take(new Set<any>());

//// [input.ts]
declare function take(x: ReadonlySet<string>): void; take(new Set<any>());
