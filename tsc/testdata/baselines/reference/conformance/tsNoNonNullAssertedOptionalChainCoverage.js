//// [tests/cases/conformance/lint/rules/no-non-null-asserted-optional-chain/tsNoNonNullAssertedOptionalChainCoverage.ts] ////

//// [input.ts]
export {};
declare const value: { field?: { next: number } } | undefined;
value?.field!;
(value?.field)!.next;
value?.field!.next;
value?.field;
value!.field;

//// [input.ts]
export {};
declare const value: { field?: { next: number } } | undefined;
value?.field!;
(value?.field)!.next;
value?.field!.next;
value?.field;
value!.field;
