//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassCGetAccessorWithGetterFirstReturnSomethingSetAccessorWi.ts] ////

//// [globals.d.ts]

//// [input.ts]
class C {
    get #accessorWithGetterFirst() {
        return something();
    }
    set #accessorWithGetterFirst(value) {
        doSomething(value);
    }
    method() {
        this.#accessorWithGetterFirst += 1;
    }
}

//// [input.ts]
class C {
    get #accessorWithGetterFirst() {
        return something();
    }
    set #accessorWithGetterFirst(value) {
        doSomething(value);
    }
    method() {
        this.#accessorWithGetterFirst += 1;
    }
}
