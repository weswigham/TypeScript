//// [tests/cases/conformance/lint/rules/no-array-delete/lintTypescriptNoArrayDeleteTypedAArrayDeleteMixedUnion.ts] ////

//// [input.ts]
declare const arr: number[] | { [key: number]: number }; delete arr[0];

//// [input.ts]
declare const arr: number[] | { [key: number]: number }; delete arr[0];
