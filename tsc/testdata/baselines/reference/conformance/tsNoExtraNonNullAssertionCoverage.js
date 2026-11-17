//// [tests/cases/conformance/lint/rules/no-extra-non-null-assertion/tsNoExtraNonNullAssertionCoverage.ts] ////

//// [input.ts]
declare const value: string | undefined;
declare const record: { value: string } | undefined;

value!!;
(record!)?.value;

value!;
record?.value;

//// [input.ts]
declare const value: string | undefined;
declare const record: { value: string } | undefined;

value!;
(record)?.value;

value!;
record?.value;
