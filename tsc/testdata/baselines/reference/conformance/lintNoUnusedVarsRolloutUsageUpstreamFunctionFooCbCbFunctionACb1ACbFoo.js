//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooCbCbFunctionACb1ACbFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(cb) { cb = (function(a) { cb(1 + a); }, cb); } foo();

//// [input.ts]
function foo(cb) { cb = (function(a) { cb(1 + a); }, cb); } foo();
