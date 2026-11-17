//// [tests/cases/conformance/lint/rules/no-empty-function/noEmptyFunctionCoreB.ts] ////

//// [input.ts]
function empty() {}
const arrow = () => {};
class Item {
    constructor(public value: number) {}
    method() {}
    async asyncMethod() {}
    *generator() {}
}
function documented() { /* intentional */ }

//// [input.ts]
function empty() {}
const arrow = () => {};
class Item {
    constructor(public value: number) {}
    method() {}
    async asyncMethod() {}
    *generator() {}
}
function documented() { /* intentional */ }
