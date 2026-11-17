//// [tests/cases/conformance/lint/rules/no-unsafe-function-type/tsNoUnsafeFunctionTypeCoverage.ts] ////

//// [input.ts]
export {};
let unsafe: Function;
type UnsafeAlias = Function;
let optionalUnsafe: Function | undefined;
let safe: () => void;
type Callable = (value: string) => number;
type Constructor = new () => object;
{
    type Function = () => void;
    let local: Function;
}

//// [input.ts]
export {};
let unsafe: Function;
type UnsafeAlias = Function;
let optionalUnsafe: Function | undefined;
let safe: () => void;
type Callable = (value: string) => number;
type Constructor = new () => object;
{
    type Function = () => void;
    let local: Function;
}
