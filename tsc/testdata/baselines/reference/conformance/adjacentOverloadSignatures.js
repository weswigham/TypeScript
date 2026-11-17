//// [tests/cases/conformance/lint/rules/adjacent-overload-signatures/adjacentOverloadSignatures.ts] ////

//// [input.ts]
export function choose(value: string): void;
export const divider = 1;
export function choose(value: number): void;
export function choose(value: unknown) {}
interface Signatures {
    (value: string): void;
    call(): void;
    (value: number): void;
    new (value: string): Signatures;
    property: number;
    new (value: number): Signatures;
    method(value: string): void;
    ["method"](value: number): void;
}
class Methods {
    static run(value: string): void;
    run(): void {}
    static run(value: unknown) {}
    #private(): void;
    "#private"(): void;
    #private(value?: number) {}
    "#private"(value?: number) {}
}
function outer() {
    function inner(value: string): void;
    const gap = 1;
    function inner(value: unknown) {}
}

//// [input.ts]
export function choose(value: string): void;
export const divider = 1;
export function choose(value: number): void;
export function choose(value: unknown) {}
interface Signatures {
    (value: string): void;
    call(): void;
    (value: number): void;
    new (value: string): Signatures;
    property: number;
    new (value: number): Signatures;
    method(value: string): void;
    ["method"](value: number): void;
}
class Methods {
    static run(value: string): void;
    run(): void {}
    static run(value: unknown) {}
    #private(): void;
    "#private"(): void;
    #private(value?: number) {}
    "#private"(value?: number) {}
}
function outer() {
    function inner(value: string): void;
    const gap = 1;
    function inner(value: unknown) {}
}
