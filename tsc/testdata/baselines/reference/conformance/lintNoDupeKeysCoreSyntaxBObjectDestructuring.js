//// [tests/cases/conformance/lint/rules/no-dupe-keys/lintNoDupeKeysCoreSyntaxBObjectDestructuring.ts] ////

//// [input.ts]
({a: first, a: second} = source); const object = { a: {a: 1}, b: 2 };

//// [input.ts]
({a: first, a: second} = source); const object = { a: {a: 1}, b: 2 };
