//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooFoo1UnusedInstanceof.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    foo = 1
    #unused
    instanceof() {}
}

//// [input.ts]
class Foo {
    foo = 1
    #unused
    instanceof() {}
}
