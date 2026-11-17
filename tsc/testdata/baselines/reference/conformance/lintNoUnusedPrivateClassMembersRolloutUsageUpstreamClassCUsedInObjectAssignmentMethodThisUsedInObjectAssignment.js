//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassCUsedInObjectAssignmentMethodThisUsedInObjectAssignment.ts] ////

//// [globals.d.ts]

//// [input.ts]
class C {
    #usedInObjectAssignment;

    method() {
        ({ [this.#usedInObjectAssignment]: a } = foo);
    }
}

//// [input.ts]
class C {
    #usedInObjectAssignment;

    method() {
        ({ [this.#usedInObjectAssignment]: a } = foo);
    }
}
