//// [tests/cases/conformance/lint/rules/no-unnecessary-condition/tsNoUnnecessaryConditionCoverage.ts] ////

//// [input.ts]
export {};
declare const object: object;
if (object) {}
declare const zero: 0n;
if (zero) {}
declare const array: object[];
if (array[0]) {}
declare const tuple: [object];
if (tuple[0]) {}
declare const nested: { first: { second: string } } | null;
nested?.first?.second;
declare const optional: { first?: { second: string } } | null;
optional?.first?.second;
declare const flag: boolean;
flag && true;
if (flag && true) {}
declare const text: string;
text ?? "default";
while (1) { break; }
declare const loopValue: 2;
while (loopValue) { break; }
declare function isString(value: unknown): value is string;
isString(text);

//// [input.ts]
export {};
declare const object: object;
if (object) {}
declare const zero: 0n;
if (zero) {}
declare const array: object[];
if (array[0]) {}
declare const tuple: [object];
if (tuple[0]) {}
declare const nested: { first: { second: string } } | null;
nested?.first?.second;
declare const optional: { first?: { second: string } } | null;
optional?.first?.second;
declare const flag: boolean;
flag && true;
if (flag && true) {}
declare const text: string;
text ?? "default";
while (1) { break; }
declare const loopValue: 2;
while (loopValue) { break; }
declare function isString(value: unknown): value is string;
isString(text);
