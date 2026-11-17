//// [tests/cases/conformance/lint/rules/no-empty-function/noEmptyFunctionCoreBOptions.ts] ////

//// [input.ts]
function allowed() {}
const arrow = () => {};
class Base { method() {} }
class Item extends Base {
    private constructor() { super(); }
    override method() {}
    @decorate methodWithDecorator() {}
}

//// [input.ts]
function allowed() {}
const arrow = () => {};
class Base { method() {} }
class Item extends Base {
    private constructor() { super(); }
    override method() {}
    @decorate methodWithDecorator() {}
}
