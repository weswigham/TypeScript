//// [tests/cases/conformance/lint/rules/no-await-in-loop/lintNoAwaitInLoopCoreSyntaxBAwaitComputedKey.ts] ////

//// [input.ts]
async function run() { while (ready) { class Item { [await key]() {} } } }

//// [input.ts]
async function run() { while (ready) { class Item { [await key]() {} } } }
