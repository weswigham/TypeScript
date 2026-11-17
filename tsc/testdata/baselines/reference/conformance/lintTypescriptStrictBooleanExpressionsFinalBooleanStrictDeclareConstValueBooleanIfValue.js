//// [tests/cases/conformance/lint/rules/strict-boolean-expressions/lintTypescriptStrictBooleanExpressionsFinalBooleanStrictDeclareConstValueBooleanIfValue.ts] ////

//// [input.ts]
declare const value: boolean; if (value && ({})) {}

//// [input.ts]
declare const value: boolean; if (value && ({})) {}
