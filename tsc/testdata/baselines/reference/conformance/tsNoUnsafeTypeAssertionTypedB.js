//// [tests/cases/conformance/lint/rules/no-unsafe-type-assertion/tsNoUnsafeTypeAssertionTypedB.ts] ////

//// [input.ts]
declare const value: string | number;
declare const unsafe: Set<any>;
value as string;
unsafe as Set<string>;
value as string | number | boolean;
function generic<T extends string>(text: string) { return text as T; }

//// [input.ts]
declare const value: string | number;
declare const unsafe: Set<any>;
value as string;
unsafe as Set<string>;
value as string | number | boolean;
function generic<T extends string>(text: string) { return text as T; }
