//// [indexOnIndexedAccessIsResolvable.ts]
interface Foo {
    a: { x: boolean };
    b: { y: boolean };
}

function extractBoolean<K extends 'a' | 'b'>(foo: Foo, key: K, innerKey: keyof Foo[K]): boolean {
    return foo[key][innerKey];
}

interface Bar {
    a: { x: string };
    b: { y: string };
}

function fetchString<K extends 'a' | 'b'>(bar: Bar, key: K, innerKey: keyof Bar[K]): void {
    bar[key][innerKey].toUpperCase();
}

//// [indexOnIndexedAccessIsResolvable.js]
function extractBoolean(foo, key, innerKey) {
    return foo[key][innerKey];
}
function fetchString(bar, key, innerKey) {
    bar[key][innerKey].toUpperCase();
}
