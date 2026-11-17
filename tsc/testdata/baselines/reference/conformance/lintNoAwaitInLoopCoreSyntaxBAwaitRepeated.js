//// [tests/cases/conformance/lint/rules/no-await-in-loop/lintNoAwaitInLoopCoreSyntaxBAwaitRepeated.ts] ////

//// [input.ts]
async function run() { for (let index = await start(); await test(); index = await next()) { await work(); } }

//// [input.ts]
async function run() { for (let index = await start(); await test(); index = await next()) { await work(); } }
