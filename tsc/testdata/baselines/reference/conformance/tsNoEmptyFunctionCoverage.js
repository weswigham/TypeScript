//// [tests/cases/conformance/lint/rules/no-empty-function/tsNoEmptyFunctionCoverage.ts] ////

//// [input.ts]
function emptyFunction() {}
const emptyArrow = () => {};
class EmptyMethod {
    run() {}
}

class PrivateConstructor {
    private constructor() {}
}
class ProtectedConstructor {
    protected constructor() {}
}
class ParameterProperty {
    constructor(public value: number) {}
}
function identity(value: number) {
    return value;
}

//// [input.ts]
function emptyFunction() {}
const emptyArrow = () => {};
class EmptyMethod {
    run() {}
}

class PrivateConstructor {
    private constructor() {}
}
class ProtectedConstructor {
    protected constructor() {}
}
class ParameterProperty {
    constructor(public value: number) {}
}
function identity(value: number) {
    return value;
}
