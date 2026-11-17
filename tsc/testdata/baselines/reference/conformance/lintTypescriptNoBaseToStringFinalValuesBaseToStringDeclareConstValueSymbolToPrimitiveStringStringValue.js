//// [tests/cases/conformance/lint/rules/no-base-to-string/lintTypescriptNoBaseToStringFinalValuesBaseToStringDeclareConstValueSymbolToPrimitiveStringStringValue.ts] ////

//// [input.ts]
declare const value: { [Symbol.toPrimitive](): string }; String(value);

//// [input.ts]
declare const value: { [Symbol.toPrimitive](): string }; String(value);
