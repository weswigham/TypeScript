//// [tests/cases/conformance/lint/rules/no-array-delete/lintTypescriptNoArrayDeleteTypedAArrayDeleteSequence.ts] ////

//// [input.ts]
declare const arr: number[]; delete arr[(f(), 1)];

//// [input.ts]
declare const arr: number[]; delete arr[(f(), 1)];
