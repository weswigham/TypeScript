//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion0x10Type.ts] ////

//// [input.ts]
type Result = `x${0x10}`;
export {};

//// [input.ts]
type Result = `x16`;
export {};
