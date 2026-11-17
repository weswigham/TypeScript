//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamClassFooSetBarUNUSEDConsoleLogFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo { set bar(UNUSED) {} } console.log(Foo)

//// [input.ts]
class Foo { set bar(UNUSED) {} } console.log(Foo)
