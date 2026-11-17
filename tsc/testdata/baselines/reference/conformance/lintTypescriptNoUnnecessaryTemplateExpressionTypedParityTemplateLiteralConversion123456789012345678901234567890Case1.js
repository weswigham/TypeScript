//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion123456789012345678901234567890Case1.ts] ////

//// [input.ts]
const result = `x${123456789012345678901234567890n}`;
export {};

//// [input.ts]
const result = `x123456789012345678901234567890`;
export {};
