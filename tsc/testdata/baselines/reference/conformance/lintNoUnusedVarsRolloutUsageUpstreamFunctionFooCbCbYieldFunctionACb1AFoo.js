//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooCbCbYieldFunctionACb1AFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function* foo(cb) { cb = yield function(a) { cb(1 + a); }; } foo();

//// [input.ts]
function* foo(cb) { cb = yield function(a) { cb(1 + a); }; } foo();
