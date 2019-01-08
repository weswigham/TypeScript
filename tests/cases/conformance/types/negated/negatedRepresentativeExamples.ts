// @strict: true
// https://github.com/Microsoft/TypeScript/issues/7993

declare function ignore<T extends ~(object & Promise<any>)>(value: T): void;
declare function readFileAsync(): Promise<string>;
declare function readFileSync(): string;
ignore(readFileSync());     // OK
ignore(readFileAsync());    // Should error

declare function map<T, U extends ~void>(values: T[], map: (value: T) => U) : U[]; // validate map callback doesn't return void

function foo() {}

map([1, 2, 3], n => n + 1); // OK
map([1, 2, 3], foo);        // Should error

function asValid<T extends ~null>(value: T, isValid: (value: T) => boolean) : T | null {
    return isValid(value) ? value : null;
}

declare const x: number;
declare const y: number | null;
asValid(x, n => n >= 0);    // OK
asValid(y, n => n >= 0);    // Should error

function tryAt<T extends ~undefined>(values: T[], index: number): T | undefined {
    return values[index];
}

declare const a: number[];
declare const b: (number | undefined)[];
tryAt(a, 0);    // OK
tryAt(b, 0);    // Should error
