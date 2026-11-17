//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion0o17nType.ts] ////

//// [input.ts]
type Result = `x${0o17n}`;
export {};

//// [input.ts]
type Result = `x15`;
export {};
