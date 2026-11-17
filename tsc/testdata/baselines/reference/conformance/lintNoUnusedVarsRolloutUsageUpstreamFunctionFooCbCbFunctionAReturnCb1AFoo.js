//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooCbCbFunctionAReturnCb1AFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(cb) { cb = function(a) { return cb(1 + a); }(); } foo();

//// [input.ts]
function foo(cb) { cb = function(a) { return cb(1 + a); }(); } foo();
