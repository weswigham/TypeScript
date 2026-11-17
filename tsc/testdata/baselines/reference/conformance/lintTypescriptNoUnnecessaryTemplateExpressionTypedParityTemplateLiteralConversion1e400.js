//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e400.ts] ////

//// [input.ts]
const result = `x${1e-400}`;
export {};

//// [input.ts]
const result = `x0`;
export {};
