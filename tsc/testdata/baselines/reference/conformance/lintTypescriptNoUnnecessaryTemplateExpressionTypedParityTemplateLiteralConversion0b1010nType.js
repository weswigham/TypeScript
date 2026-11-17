//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion0b1010nType.ts] ////

//// [input.ts]
type Result = `x${0b1010n}`;
export {};

//// [input.ts]
type Result = `x10`;
export {};
