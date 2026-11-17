//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamLetAAA10FunctionFooA11AA13.ts] ////

//// [globals.d.ts]

//// [input.ts]
let a = 'a';
a = 10;
function foo(){a = 11;a = () => {a = 13}}

//// [input.ts]
let a = 'a';
a = 10;
function foo(){a = 11;a = () => {a = 13}}
