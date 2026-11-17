//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e21.ts] ////

//// [input.ts]
const result = `x${1e21}`;
export {};

//// [input.ts]
const result = `x1e+21`;
export {};
