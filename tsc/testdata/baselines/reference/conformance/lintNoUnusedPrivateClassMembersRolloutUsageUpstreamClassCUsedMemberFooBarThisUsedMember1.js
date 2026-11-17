//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassCUsedMemberFooBarThisUsedMember1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class C {
    #usedMember;

    foo() {
        bar(this.#usedMember += 1);
    }
}

//// [input.ts]
class C {
    #usedMember;

    foo() {
        bar(this.#usedMember += 1);
    }
}
