//// [tests/cases/conformance/lint/rules/no-await-in-loop/lintNoAwaitInLoopCoreSyntaxBAwaitBoundaries.ts] ////

//// [input.ts]
async function run() { for await (const item of items) { await work(); while (item) await work(); } while (true) { const callback = async () => await work(); } }

//// [input.ts]
async function run() { for await (const item of items) { await work(); while (item) await work(); } while (true) { const callback = async () => await work(); } }
