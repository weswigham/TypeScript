//// [tests/cases/conformance/lint/rules/no-dupe-keys/lintNoDupeKeysCoreSyntaxBObjectDuplicates.ts] ////

//// [input.ts]
const object = { a: 1, ['a']: 2, get pair() {}, set pair(value) {}, get pair() {}, __proto__: null, ['__proto__']: 1 };

//// [input.ts]
const object = { a: 1, ['a']: 2, get pair() {}, set pair(value) {}, get pair() {}, __proto__: null, ['__proto__']: 1 };
