//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarAFunctionReturnFunctionAA.ts] ////

//// [globals.d.ts]

//// [input.ts]
var a = function(){ return function () { a(); } }; a();

//// [input.ts]
var a = function(){ return function () { a(); } }; a();
