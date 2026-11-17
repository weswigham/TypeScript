//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooFirstSecondDoStuffFunctionConsoleLogSecondFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(first, second) {
doStuff(function() {
console.log(second);});}; foo()

//// [input.ts]
function foo(first, second) {
doStuff(function() {
console.log(second);});}; foo()
