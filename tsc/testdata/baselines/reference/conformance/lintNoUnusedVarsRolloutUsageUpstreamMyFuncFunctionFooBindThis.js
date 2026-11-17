//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamMyFuncFunctionFooBindThis.ts] ////

//// [globals.d.ts]

//// [input.ts]
myFunc(function foo() {}.bind(this))

//// [input.ts]
myFunc(function foo() {}.bind(this))
