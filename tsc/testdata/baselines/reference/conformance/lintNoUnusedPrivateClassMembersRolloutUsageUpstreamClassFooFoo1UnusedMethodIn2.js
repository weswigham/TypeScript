//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooFoo1UnusedMethodIn2.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    foo = 1
    #unusedMethod() {}
    in = 2
}

//// [input.ts]
class Foo {
    foo = 1
    #unusedMethod() {}
    in = 2
}
