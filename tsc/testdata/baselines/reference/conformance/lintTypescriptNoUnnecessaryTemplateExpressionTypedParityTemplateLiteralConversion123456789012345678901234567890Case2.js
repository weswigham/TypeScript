//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion123456789012345678901234567890Case2.ts] ////

//// [input.ts]
type Result = `x${123456789012345678901234567890n}`;
export {};

//// [input.ts]
type Result = `x123456789012345678901234567890`;
export {};
