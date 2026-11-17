//// [tests/cases/conformance/lint/rules/method-signature-style/tsMethodSignatureStyleCoverage.ts] ////

//// [input.ts]
interface InvalidMethod {
    run(value: number): void;
}
type InvalidTypeMethod = {
    map<Value>(value: Value): Value;
};
interface PolymorphicThis {
    chain(): this;
}
interface ValidProperty {
    run: (value: number) => void;
    readonly read: () => number;
}
class ValidClassMethod {
    run(value: number): number { return value; }
}
export {};

//// [input.ts]
interface InvalidMethod {
    run: (value: number) => void;
}
type InvalidTypeMethod = {
    map: <Value>(value: Value) => Value;
};
interface PolymorphicThis {
    chain(): this;
}
interface ValidProperty {
    run: (value: number) => void;
    readonly read: () => number;
}
class ValidClassMethod {
    run(value: number): number { return value; }
}
export {};
