//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeSpans1AsAny.ts] ////

//// [input.ts]
declare function take(value: string): void; take(1 as any);

//// [input.ts]
declare function take(value: string): void; take(1 as any);
