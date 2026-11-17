//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamConstFooClassCBarAsyncWrapFooBarAwaitBaz.ts] ////

//// [globals.d.ts]

//// [input.ts]
const foo = {}; class C { #bar; async wrap() { foo.#bar += await baz } }

//// [input.ts]
const foo = {}; class C { #bar; async wrap() { foo.#bar += await baz } }
