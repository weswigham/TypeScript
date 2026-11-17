//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooCbCbFunctionFunctionSomethingACb1ARegisterSomethingFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(cb) { cb = function() { function something(a) { cb(1 + a); } register(something); }(); } foo();

//// [input.ts]
function foo(cb) { cb = function() { function something(a) { cb(1 + a); } register(something); }(); } foo();
