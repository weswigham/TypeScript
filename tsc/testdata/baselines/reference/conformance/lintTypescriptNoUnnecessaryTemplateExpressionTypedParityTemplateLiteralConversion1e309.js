//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e309.ts] ////

//// [input.ts]
const result = `x${1e309}`;
export {};

//// [input.ts]
const result = `xInfinity`;
export {};
