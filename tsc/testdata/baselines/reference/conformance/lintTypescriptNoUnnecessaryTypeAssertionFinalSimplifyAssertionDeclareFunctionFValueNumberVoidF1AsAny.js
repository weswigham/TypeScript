//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionDeclareFunctionFValueNumberVoidF1AsAny.ts] ////

//// [input.ts]
declare function f(value: number): void; f(1 as any);

//// [input.ts]
declare function f(value: number): void; f(1);
