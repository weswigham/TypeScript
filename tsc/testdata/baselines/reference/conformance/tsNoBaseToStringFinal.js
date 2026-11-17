//// [tests/cases/conformance/lint/rules/no-base-to-string/tsNoBaseToStringFinal.ts] ////

//// [input.ts]
export {};
declare const unknownValue: unknown;
declare const mixed: string | { value: number };
declare const tuple: [string, { value: number }];
declare const coercible: { [Symbol.toPrimitive](): string };
class Custom {
    toString() { return "custom"; }
}
String({});
String(mixed);
String(unknownValue);
tuple.join();
({}).toLocaleString();
String(new Custom());
String(coercible);
function stringify<T extends { value: number }>(value: T) {
    return `${value}`;
}

//// [input.ts]
export {};
declare const unknownValue: unknown;
declare const mixed: string | { value: number };
declare const tuple: [string, { value: number }];
declare const coercible: { [Symbol.toPrimitive](): string };
class Custom {
    toString() { return "custom"; }
}
String({});
String(mixed);
String(unknownValue);
tuple.join();
({}).toLocaleString();
String(new Custom());
String(coercible);
function stringify<T extends { value: number }>(value: T) {
    return `${value}`;
}
