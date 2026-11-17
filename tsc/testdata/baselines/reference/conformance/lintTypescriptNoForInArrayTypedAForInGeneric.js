//// [tests/cases/conformance/lint/rules/no-for-in-array/lintTypescriptNoForInArrayTypedAForInGeneric.ts] ////

//// [input.ts]
function f<T extends any[]>(arr: T) { for (const key in arr) {} }

//// [input.ts]
function f<T extends any[]>(arr: T) { for (const key in arr) {} }
