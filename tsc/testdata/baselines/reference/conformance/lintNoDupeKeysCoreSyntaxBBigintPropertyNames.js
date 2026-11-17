//// [tests/cases/conformance/lint/rules/no-dupe-keys/lintNoDupeKeysCoreSyntaxBBigintPropertyNames.ts] ////

//// [input.ts]
const object = { 0x10n: 1, 16: 2, [0b1_0000n]: 3, '16': 4, 0o20n: 5 };

//// [input.ts]
const object = { 0x10n: 1, 16: 2, [0b1_0000n]: 3, '16': 4, 0o20n: 5 };
