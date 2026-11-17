//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamLetFooInitFooFoo2FunctionInitFoo1.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo;
init();
foo = foo + 2;
function init() {foo = 1;}

//// [input.ts]
let foo;
init();
foo = foo + 2;
function init() {foo = 1;}
