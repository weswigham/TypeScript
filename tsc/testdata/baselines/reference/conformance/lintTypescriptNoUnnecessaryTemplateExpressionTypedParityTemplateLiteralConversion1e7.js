//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e7.ts] ////

//// [input.ts]
const result = `x${1e-7}`;
export {};

//// [input.ts]
const result = `x1e-7`;
export {};
