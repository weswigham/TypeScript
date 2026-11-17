//// [tests/cases/conformance/lint/rules/no-await-in-loop/lintNoAwaitInLoopCoreSyntaxBAwaitResources.ts] ////

//// [input.ts]
async function run() { while (true) { await using resource = acquire(); } for (await using resource of resources) {} }

//// [input.ts]
async function run() { while (true) { await using resource = acquire(); } for (await using resource of resources) {} }
