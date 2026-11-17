//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooFoo1UnusedMethodGenerator.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    foo = 1
    #unusedMethod() {}
    *generator() {}
}

//// [input.ts]
class Foo {
    foo = 1
    #unusedMethod() {}
    *generator() {}
}
