//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooGetUnusedAccessorReturn1SetUnusedAccessorValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    get #unusedAccessor() {
        return 1;
    }
    set #unusedAccessor(value) {}
}

//// [input.ts]
class Foo {
    get #unusedAccessor() {
        return 1;
    }
    set #unusedAccessor(value) {}
}
