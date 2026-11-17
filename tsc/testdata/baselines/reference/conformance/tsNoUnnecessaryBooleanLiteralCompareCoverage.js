//// [tests/cases/conformance/lint/rules/no-unnecessary-boolean-literal-compare/tsNoUnnecessaryBooleanLiteralCompareCoverage.ts] ////

//// [input.ts]
export {};
declare const flag: boolean;
flag === true;
flag !== false;
declare const nullable: boolean | undefined;
nullable === true;
declare const unknownValue: unknown;
unknownValue === true;
function constrained<T extends boolean>(value: T) { return value !== false; }
function unconstrained<T>(value: T) { return value !== false; }
flag;

//// [input.ts]
export {};
declare const flag: boolean;
flag;
flag;
declare const nullable: boolean | undefined;
nullable ?? false;
declare const unknownValue: unknown;
unknownValue === true;
function constrained<T extends boolean>(value: T) { return value; }
function unconstrained<T>(value: T) { return value !== false; }
flag;
