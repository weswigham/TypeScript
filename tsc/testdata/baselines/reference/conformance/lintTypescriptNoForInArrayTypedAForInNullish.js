//// [tests/cases/conformance/lint/rules/no-for-in-array/lintTypescriptNoForInArrayTypedAForInNullish.ts] ////

//// [input.ts]
declare const arr: null | undefined; for (const key in arr) {}

//// [input.ts]
declare const arr: null | undefined; for (const key in arr) {}
