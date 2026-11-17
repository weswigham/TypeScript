//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e20.ts] ////

//// [input.ts]
const result = `x${1e20}`;
export {};

//// [input.ts]
const result = `x100000000000000000000`;
export {};
