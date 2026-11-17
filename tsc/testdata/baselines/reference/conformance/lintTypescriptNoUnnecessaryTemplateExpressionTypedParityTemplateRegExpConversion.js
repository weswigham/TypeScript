//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateRegExpConversion.ts] ////

//// [input.ts]
const result = `x${/a/ig}`;
export {};

//// [input.ts]
const result = `x/a/gi`;
export {};
