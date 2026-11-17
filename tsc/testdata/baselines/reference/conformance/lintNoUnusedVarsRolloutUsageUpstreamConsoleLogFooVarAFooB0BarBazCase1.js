//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConsoleLogFooVarAFooB0BarBazCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
console.log('foo')
var [a] = foo;
+b > 0 ? bar() : baz()

//// [input.ts]
console.log('foo')
var [a] = foo;
+b > 0 ? bar() : baz()
