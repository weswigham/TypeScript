//// [tests/cases/conformance/lint/rules/no-await-in-loop/lintNoAwaitInLoopCoreSyntaxBAwaitComputedAccessors.ts] ////

//// [input.ts]
async function run() { while (ready) { class Item { get [await getter]() {} set [await setter](value) {} } } }

//// [input.ts]
async function run() { while (ready) { class Item { get [await getter]() {} set [await setter](value) {} } } }
