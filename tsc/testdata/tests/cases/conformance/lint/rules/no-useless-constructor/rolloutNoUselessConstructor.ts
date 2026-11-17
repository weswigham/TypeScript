// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-useless-constructor": "error" } }
}
// @filename: input.ts
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