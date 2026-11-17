//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooCbCbFunctionACb1ABarNotCbFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(cb) { cb = function(a) { cb(1 + a); }; bar(not_cb); } foo();

//// [input.ts]
function foo(cb) { cb = function(a) { cb(1 + a); }; bar(not_cb); } foo();
