//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarRefRefSetIntervalFunctionClearIntervalRef10.ts] ////

//// [globals.d.ts]

//// [input.ts]
var ref;
ref = setInterval(
    function(){
        clearInterval(ref);
    }, 10);

//// [input.ts]
var ref;
ref = setInterval(
    function(){
        clearInterval(ref);
    }, 10);
