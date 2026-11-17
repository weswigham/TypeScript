//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion0xFFFFn.ts] ////

//// [input.ts]
const result = `x${0xFF_FFn}`;
export {};

//// [input.ts]
const result = `x65535`;
export {};
