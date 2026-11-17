//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooSetAccessorUsedInMemberAccessValueMethodAThisAccesso.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    set #accessorUsedInMemberAccess(value) {}

    method(a) {
        [this.#accessorUsedInMemberAccess] = a;
    }
}

//// [input.ts]
class Foo {
    set #accessorUsedInMemberAccess(value) {}

    method(a) {
        [this.#accessorUsedInMemberAccess] = a;
    }
}
