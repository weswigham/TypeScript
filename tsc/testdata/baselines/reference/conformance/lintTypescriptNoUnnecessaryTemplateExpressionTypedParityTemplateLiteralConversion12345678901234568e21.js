//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion12345678901234568e21.ts] ////

//// [input.ts]
const result = `x${1.2345678901234568e21}`;
export {};

//// [input.ts]
const result = `x1.2345678901234568e+21`;
export {};
