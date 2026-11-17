//// [tests/cases/conformance/lint/rules/no-inner-declarations/lintNoInnerDeclarationsCoreScopeBInnerDefaults.ts] ////

//// [input.ts]
if (ready) { function nested() {} var item; } function run() { function root() {} }

//// [input.ts]
if (ready) { function nested() {} var item; } function run() { function root() {} }
