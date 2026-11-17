//// [tests/cases/conformance/lint/rules/no-confusing-non-null-assertion/tsNoConfusingNonNullAssertionCoverage.ts] ////

//// [input.ts]
declare const value: string | undefined;
declare const other: string;
declare const record: Record<string, unknown>;

value! === other;
value! in record;

(value!) === other;
(value!) in record;
value === other;

//// [input.ts]
declare const value: string | undefined;
declare const other: string;
declare const record: Record<string, unknown>;

value! === other;
value! in record;

(value!) === other;
(value!) in record;
value === other;
