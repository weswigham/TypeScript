//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooCbCb0FunctionACb1AFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(cb) { cb = (0, function(a) { cb(1 + a); }); } foo();

//// [input.ts]
function foo(cb) { cb = (0, function(a) { cb(1 + a); }); } foo();
