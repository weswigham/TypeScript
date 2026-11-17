//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamLetCCC10FunctionFoo1C11CC13CFoo1.ts] ////

//// [globals.d.ts]

//// [input.ts]
let c = 'c';
c = 10;
function foo1() {c = 11; c = () => { c = 13 }} c = foo1

//// [input.ts]
let c = 'c';
c = 10;
function foo1() {c = 11; c = () => { c = 13 }} c = foo1
