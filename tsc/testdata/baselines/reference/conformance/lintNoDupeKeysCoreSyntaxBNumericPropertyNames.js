//// [tests/cases/conformance/lint/rules/no-dupe-keys/lintNoDupeKeysCoreSyntaxBNumericPropertyNames.ts] ////

//// [input.ts]
const object = { 0x10: 1, 16: 2, 1n: 1, 1: 2, [null]: 1, null: 2 };

//// [input.ts]
const object = { 0x10: 1, 16: 2, 1n: 1, 1: 2, [null]: 1, null: 2 };
