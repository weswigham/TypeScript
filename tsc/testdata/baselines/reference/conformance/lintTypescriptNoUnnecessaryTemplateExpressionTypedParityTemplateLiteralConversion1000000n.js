//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1000000n.ts] ////

//// [input.ts]
const result = `x${1_000_000n}`;
export {};

//// [input.ts]
const result = `x1000000`;
export {};
