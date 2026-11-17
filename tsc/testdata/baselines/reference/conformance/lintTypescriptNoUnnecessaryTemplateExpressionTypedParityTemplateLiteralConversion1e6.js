//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e6.ts] ////

//// [input.ts]
const result = `x${1e-6}`;
export {};

//// [input.ts]
const result = `x0.000001`;
export {};
