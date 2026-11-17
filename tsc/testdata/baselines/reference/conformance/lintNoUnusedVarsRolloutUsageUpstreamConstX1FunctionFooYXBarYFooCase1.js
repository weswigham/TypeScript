//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstX1FunctionFooYXBarYFooCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
const x = 1; function foo({y = x} = {}) { bar(y); } foo();

//// [input.ts]
const x = 1; function foo({y = x} = {}) { bar(y); } foo();
