//// [tests/cases/conformance/lint/rules/max-params/tsMaxParamsCoverage.ts] ////

//// [input.ts]
function tooMany(first: number, second: number, third: number): number {
    return first + second + third;
}
declare function tooManyDeclared(first: number, second: number, third: number): void;
const tooManyArrow = (first: number, second: number, third: number) => first + second + third;
function validPair(first: number, second: number): number { return first + second; }
function validVoidThis(this: void, first: number, second: number): number { return first + second; }
function validRest(first: number, ...rest: number[]): number { return first + rest.length; }
export {};

//// [input.ts]
function tooMany(first: number, second: number, third: number): number {
    return first + second + third;
}
declare function tooManyDeclared(first: number, second: number, third: number): void;
const tooManyArrow = (first: number, second: number, third: number) => first + second + third;
function validPair(first: number, second: number): number { return first + second; }
function validVoidThis(this: void, first: number, second: number): number { return first + second; }
function validRest(first: number, ...rest: number[]): number { return first + rest.length; }
export {};
