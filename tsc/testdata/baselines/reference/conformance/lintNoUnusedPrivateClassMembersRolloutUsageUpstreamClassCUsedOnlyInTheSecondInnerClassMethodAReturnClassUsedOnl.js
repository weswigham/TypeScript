//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassCUsedOnlyInTheSecondInnerClassMethodAReturnClassUsedOnl.ts] ////

//// [globals.d.ts]

//// [input.ts]
class C {
    #usedOnlyInTheSecondInnerClass;

    method(a) {
        return class {
            #usedOnlyInTheSecondInnerClass;

            method2(b) {
                foo = b.#usedOnlyInTheSecondInnerClass;
            }

            method3(b) {
                foo = b.#usedOnlyInTheSecondInnerClass;
            }
        }
    }
}

//// [input.ts]
class C {
    #usedOnlyInTheSecondInnerClass;

    method(a) {
        return class {
            #usedOnlyInTheSecondInnerClass;

            method2(b) {
                foo = b.#usedOnlyInTheSecondInnerClass;
            }

            method3(b) {
                foo = b.#usedOnlyInTheSecondInnerClass;
            }
        }
    }
}
