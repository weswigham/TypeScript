//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooCbCbTagHelloFunctionACb1AFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(cb) { cb = tag`hello${function(a) { cb(1 + a); }}`; } foo();

//// [input.ts]
function foo(cb) { cb = tag`hello${function(a) { cb(1 + a); }}`; } foo();
