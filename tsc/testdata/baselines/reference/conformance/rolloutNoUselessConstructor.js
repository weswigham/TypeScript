//// [tests/cases/conformance/lint/rules/no-useless-constructor/rolloutNoUselessConstructor.ts] ////

//// [input.ts]
export {};
class Empty { constructor() {} }
class Derived extends Base { constructor(value: number) { super(value); } }
class ParameterProperty { constructor(public value: number) {} }
class Restricted { private constructor() {} }
class PublicDerived extends Base { public constructor() { super(); } }
class Separator {
    value = 1
    constructor() {}
    [computed]() {}
}

//// [input.ts]
export {};
class Empty { constructor() {} }
class Derived extends Base { constructor(value: number) { super(value); } }
class ParameterProperty { constructor(public value: number) {} }
class Restricted { private constructor() {} }
class PublicDerived extends Base { public constructor() { super(); } }
class Separator {
    value = 1
    constructor() {}
    [computed]() {}
}
