//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion0xFFFFnType.ts] ////

//// [input.ts]
type Result = `x${0xFF_FFn}`;
export {};

//// [input.ts]
type Result = `x65535`;
export {};
