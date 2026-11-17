//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeArgumentUnknown.ts] ////

//// [input.ts]
declare const value: any; declare function take(x: unknown): void; take(value);

//// [input.ts]
declare const value: any; declare function take(x: unknown): void; take(value);
