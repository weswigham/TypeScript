//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassCUsedInInnerClassMethodAReturnClassFooAUsedInInnerClass.ts] ////

//// [globals.d.ts]

//// [input.ts]
class C {
    #usedInInnerClass;

    method(a) {
        return class {
            foo = a.#usedInInnerClass;
        }
    }
}

//// [input.ts]
class C {
    #usedInInnerClass;

    method(a) {
        return class {
            foo = a.#usedInInnerClass;
        }
    }
}
