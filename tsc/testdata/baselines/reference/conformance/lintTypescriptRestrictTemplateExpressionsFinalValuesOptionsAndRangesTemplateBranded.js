//// [tests/cases/conformance/lint/rules/restrict-template-expressions/lintTypescriptRestrictTemplateExpressionsFinalValuesOptionsAndRangesTemplateBranded.ts] ////

//// [input.ts]
declare const value: string & { brand: true }; `${value}`;

//// [input.ts]
declare const value: string & { brand: true }; `${value}`;
