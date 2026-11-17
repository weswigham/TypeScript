//// [tests/cases/conformance/lint/rules/no-meaningless-void-operator/tsNoMeaninglessVoidOperatorTypedA.ts] ////

//// [input.ts]
declare function nothing(): void;
declare function fail(): never;
declare function value(): string;
declare const promise: Promise<number>;
void nothing();
void fail();
void value();
void promise;
void 0;
void 1;
const result = void "value";
let assigned: number;
() => void (assigned = 1);

//// [input.ts]
declare function nothing(): void;
declare function fail(): never;
declare function value(): string;
declare const promise: Promise<number>;
nothing();
void fail();
void value();
void promise;
void 0;
1;
const result = void "value";
let assigned: number;
() => void (assigned = 1);
