//// [tests/cases/conformance/lint/rules/no-array-delete/lintTypescriptNoArrayDeleteTypedAArrayDeleteGeneric.ts] ////

//// [input.ts]
function f<T extends number[]>(arr: T) { delete arr[0]; }

//// [input.ts]
function f<T extends number[]>(arr: T) { delete arr[0]; }
