//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConsoleLogFooVarAB0BarBaz.ts] ////

//// [globals.d.ts]

//// [input.ts]
console.log('foo')
var a
+b > 0 ? bar() : baz()

//// [input.ts]
console.log('foo')
var a
+b > 0 ? bar() : baz()
