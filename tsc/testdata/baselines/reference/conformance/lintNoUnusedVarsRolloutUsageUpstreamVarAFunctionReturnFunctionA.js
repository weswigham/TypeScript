//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarAFunctionReturnFunctionA.ts] ////

//// [globals.d.ts]

//// [input.ts]
var a = function(){ return function() { a(); } };

//// [input.ts]
var a = function(){ return function() { a(); } };
