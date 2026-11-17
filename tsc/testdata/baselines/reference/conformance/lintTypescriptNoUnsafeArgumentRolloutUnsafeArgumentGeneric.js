//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeArgumentGeneric.ts] ////

//// [input.ts]
declare const value: Set<any>; declare function take(x: Set<string>): void; take(value);

//// [input.ts]
declare const value: Set<any>; declare function take(x: Set<string>): void; take(value);
