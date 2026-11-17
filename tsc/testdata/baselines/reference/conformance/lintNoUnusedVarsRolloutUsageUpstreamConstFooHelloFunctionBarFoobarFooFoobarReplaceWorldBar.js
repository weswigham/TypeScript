//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstFooHelloFunctionBarFoobarFooFoobarReplaceWorldBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
const foo = "hello!";function bar(foobar = foo) {  foobar.replace(/!$/, " world!");}
bar();

//// [input.ts]
const foo = "hello!";function bar(foobar = foo) {  foobar.replace(/!$/, " world!");}
bar();
