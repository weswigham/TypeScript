//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooNIfN2Return1ReturnNFooN1.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(n) {
if (n < 2) return 1;
return n * foo(n - 1);}

//// [input.ts]
function foo(n) {
if (n < 2) return 1;
return n * foo(n - 1);}
