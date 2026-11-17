//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooCbVarBCbBFunctionACb1ABFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(cb) { var b; cb = b = function(a) { cb(1 + a); }; b(); } foo();

//// [input.ts]
function foo(cb) { var b; cb = b = function(a) { cb(1 + a); }; b(); } foo();
