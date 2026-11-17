//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooFirstSecondDoStuffFunctionConsoleLogSecond.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(first, second) {
doStuff(function() {
console.log(second);});}

//// [input.ts]
function foo(first, second) {
doStuff(function() {
console.log(second);});}
