//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassCUnusedOnlyInSecondNestedClassFooReturnClassUnusedOnlyI.ts] ////

//// [globals.d.ts]

//// [input.ts]
class C {
    #unusedOnlyInSecondNestedClass;

    foo() {
        return class {
            #unusedOnlyInSecondNestedClass;

            bar() {
                return this.#unusedOnlyInSecondNestedClass;
            }
        };
    }

    baz() {
        return this.#unusedOnlyInSecondNestedClass;
    }

    bar() {
        return class {
            #unusedOnlyInSecondNestedClass;
        }
    }
}

//// [input.ts]
class C {
    #unusedOnlyInSecondNestedClass;

    foo() {
        return class {
            #unusedOnlyInSecondNestedClass;

            bar() {
                return this.#unusedOnlyInSecondNestedClass;
            }
        };
    }

    baz() {
        return this.#unusedOnlyInSecondNestedClass;
    }

    bar() {
        return class {
            #unusedOnlyInSecondNestedClass;
        }
    }
}
