//// [tests/cases/conformance/lint/rules/no-for-in-array/lintTypescriptNoForInArrayTypedAForInNumericIndexAlone.ts] ////

//// [input.ts]
declare const obj: { [key: number]: number }; for (const key in obj) {}

//// [input.ts]
declare const obj: { [key: number]: number }; for (const key in obj) {}
