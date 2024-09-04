/// <reference no-default-lib="true" />
declare const a: symbol;
export class A {
    [a]() { return 1 };
}
declare const e1: A[typeof a]; // no error, `A` has `symbol` index
