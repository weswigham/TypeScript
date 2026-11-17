//// [tests/cases/conformance/lint/rules/strict-boolean-expressions/lintTypescriptStrictBooleanExpressionsFinalBooleanStrictDeclareConstValueBooleanBrandBIfValue.ts] ////

//// [input.ts]
declare const value: boolean & { brand: 'b' }; if (value) {}

//// [input.ts]
declare const value: boolean & { brand: 'b' }; if (value) {}
