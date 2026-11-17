//// [tests/cases/conformance/lint/rules/no-dupe-args/lintNoDupeArgsDefaultCase12.ts] ////

//// [input.ts]
function f(first, second = function(first) {}) {}

//// [input.ts]
function f(first, second = function(first) {}) {}
