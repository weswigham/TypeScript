//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassCSetAccessorWithSetterFirstValueDoSomethingValueGetAcce.ts] ////

//// [globals.d.ts]

//// [input.ts]
class C {
    set #accessorWithSetterFirst(value) {
        doSomething(value);
    }
    get #accessorWithSetterFirst() {
        return something();
    }
    method() {
        this.#accessorWithSetterFirst += 1;
    }
}

//// [input.ts]
class C {
    set #accessorWithSetterFirst(value) {
        doSomething(value);
    }
    get #accessorWithSetterFirst() {
        return something();
    }
    method() {
        this.#accessorWithSetterFirst += 1;
    }
}
