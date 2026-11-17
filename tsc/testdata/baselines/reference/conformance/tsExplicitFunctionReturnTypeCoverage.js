//// [tests/cases/conformance/lint/rules/explicit-function-return-type/tsExplicitFunctionReturnTypeCoverage.ts] ////

//// [input.ts]
function missingReturn(value: number) { return value; }
const missingArrow = (value: number) => value;
class MissingGetter {
    get value() { return 1; }
}
function validReturn(value: number): number { return value; }
const validContextual: (value: number) => number = value => value;
const validConstArrow = () => "literal" as const;
class ValidSetter {
    private stored = 0;
    constructor() {}
    set value(value: number) { this.stored = value; }
    get value(): number { return this.stored; }
}
export {};

//// [input.ts]
function missingReturn(value: number) { return value; }
const missingArrow = (value: number) => value;
class MissingGetter {
    get value() { return 1; }
}
function validReturn(value: number): number { return value; }
const validContextual: (value: number) => number = value => value;
const validConstArrow = () => "literal" as const;
class ValidSetter {
    private stored = 0;
    constructor() {}
    set value(value: number) { this.stored = value; }
    get value(): number { return this.stored; }
}
export {};
