//// [tests/cases/conformance/lint/rules/class-methods-use-this/classMethodsUseThisCore.ts] ////

//// [input.ts]
class Example {
    constructor() {}
    missing() { return 1; }
    nested() { return function() { return this; }; }
    present() { return () => this; }
    field = () => 1;
    excepted() {}
    static staticMethod() {}
}

//// [input.ts]
class Example {
    constructor() {}
    missing() { return 1; }
    nested() { return function() { return this; }; }
    present() { return () => this; }
    field = () => 1;
    excepted() {}
    static staticMethod() {}
}
