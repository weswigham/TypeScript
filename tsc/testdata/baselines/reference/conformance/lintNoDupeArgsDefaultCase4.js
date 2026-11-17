//// [tests/cases/conformance/lint/rules/no-dupe-args/lintNoDupeArgsDefaultCase4.ts] ////

//// [input.ts]
function f({ key: [first, { other: first }] }) {}

//// [input.ts]
function f({ key: [first, { other: first }] }) {}
