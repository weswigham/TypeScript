//// [tests/cases/conformance/lint/rules/no-for-in-array/lintTypescriptNoForInArrayTypedAForInNumericLength.ts] ////

//// [input.ts]
declare const obj: { [key: number]: number; length: 1 }; for (const key in obj) {}

//// [input.ts]
declare const obj: { [key: number]: number; length: 1 }; for (const key in obj) {}
