//// [tests/cases/conformance/lint/rules/non-nullable-type-assertion-style/tsNonNullableTypeAssertionStyleTypedB.ts] ////

//// [input.ts]
declare const nullable: string | null | undefined;
nullable as string;
nullable as string | null;
nullable as any;
"literal" as const;

//// [input.ts]
declare const nullable: string | null | undefined;
nullable!;
nullable as string | null;
nullable as any;
"literal" as const;
