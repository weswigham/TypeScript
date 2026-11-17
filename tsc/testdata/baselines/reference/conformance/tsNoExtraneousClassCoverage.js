//// [tests/cases/conformance/lint/rules/no-extraneous-class/tsNoExtraneousClassCoverage.ts] ////

//// [input.ts]
class Empty {}
class ConstructorOnly {
    constructor() {}
}
class StaticOnly {
    static value = 1;
}

class InstanceProperty {
    value = 1;
}
class ParameterProperty {
    constructor(public value: number) {}
}
class Derived extends InstanceProperty {}

//// [input.ts]
class Empty {}
class ConstructorOnly {
    constructor() {}
}
class StaticOnly {
    static value = 1;
}

class InstanceProperty {
    value = 1;
}
class ParameterProperty {
    constructor(public value: number) {}
}
class Derived extends InstanceProperty {}
