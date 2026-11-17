//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeArgumentAny.ts] ////

//// [input.ts]
declare const value: any; declare function take(x: string): void; take(value);

//// [input.ts]
declare const value: any; declare function take(x: string): void; take(value);
