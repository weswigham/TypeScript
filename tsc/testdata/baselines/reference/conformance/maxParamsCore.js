//// [tests/cases/conformance/lint/rules/max-params/maxParamsCore.ts] ////

//// [input.ts]
function excessive(first: number, second: number, third: number) {}
function valid(this: object, first: number, second: number) {}
type Excessive = (first: number, second: number, third: number) => void;
declare function declared(first: number, second: number, third: number): void;

//// [input.ts]
function excessive(first: number, second: number, third: number) {}
function valid(this: object, first: number, second: number) {}
type Excessive = (first: number, second: number, third: number) => void;
declare function declared(first: number, second: number, third: number): void;
