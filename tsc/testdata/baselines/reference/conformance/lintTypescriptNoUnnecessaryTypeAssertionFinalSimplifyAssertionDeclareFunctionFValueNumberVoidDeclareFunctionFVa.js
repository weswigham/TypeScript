//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionDeclareFunctionFValueNumberVoidDeclareFunctionFVa.ts] ////

//// [input.ts]
declare function f(value: number): void; declare function f(value: string): void; f(1 as number | string);

//// [input.ts]
declare function f(value: number): void; declare function f(value: string): void; f(1 as number | string);
