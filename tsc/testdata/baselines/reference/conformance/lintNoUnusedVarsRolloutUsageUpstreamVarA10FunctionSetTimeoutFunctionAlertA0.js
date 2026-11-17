//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarA10FunctionSetTimeoutFunctionAlertA0.ts] ////

//// [globals.d.ts]

//// [input.ts]
var a=10; (function() { setTimeout(function() { alert(a); }, 0); })();

//// [input.ts]
var a=10; (function() { setTimeout(function() { alert(a); }, 0); })();
