//// [tests/cases/conformance/lint/rules/no-for-in-array/lintTypescriptNoForInArrayTypedAForInUnion.ts] ////

//// [input.ts]
declare const arr: string[] | null | { a: 1 }; for (const key in arr) {}

//// [input.ts]
declare const arr: string[] | null | { a: 1 }; for (const key in arr) {}
