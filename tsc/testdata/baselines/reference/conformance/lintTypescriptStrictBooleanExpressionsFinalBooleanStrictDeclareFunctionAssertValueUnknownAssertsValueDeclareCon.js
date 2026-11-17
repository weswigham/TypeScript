//// [tests/cases/conformance/lint/rules/strict-boolean-expressions/lintTypescriptStrictBooleanExpressionsFinalBooleanStrictDeclareFunctionAssertValueUnknownAssertsValueDeclareCon.ts] ////

//// [input.ts]
declare function assert(value: unknown): asserts value; declare const value: string | null; assert(value);

//// [input.ts]
declare function assert(value: unknown): asserts value; declare const value: string | null; assert(value);
