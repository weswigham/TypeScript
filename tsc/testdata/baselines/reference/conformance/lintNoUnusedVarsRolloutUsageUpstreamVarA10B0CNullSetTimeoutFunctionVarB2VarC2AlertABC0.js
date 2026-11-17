//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarA10B0CNullSetTimeoutFunctionVarB2VarC2AlertABC0.ts] ////

//// [globals.d.ts]

//// [input.ts]
var a=10, b=0, c=null; setTimeout(function() { var b=2; var c=2; alert(a+b+c); }, 0);

//// [input.ts]
var a=10, b=0, c=null; setTimeout(function() { var b=2; var c=2; alert(a+b+c); }, 0);
