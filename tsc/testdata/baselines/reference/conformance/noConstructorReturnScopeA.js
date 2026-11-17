//// [tests/cases/conformance/lint/rules/no-constructor-return/noConstructorReturnScopeA.ts] ////

//// [input.ts]
class Example {
    constructor(value: boolean) {
        function nested() { return 1; }
        const arrow = () => { return 2; };
        if (value) { return {}; }
        return;
    }
    method() { return 3; }
}

//// [input.ts]
class Example {
    constructor(value: boolean) {
        function nested() { return 1; }
        const arrow = () => { return 2; };
        if (value) { return {}; }
        return;
    }
    method() { return 3; }
}
