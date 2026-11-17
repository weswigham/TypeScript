//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion0XFFnType.ts] ////

//// [input.ts]
type Result = `x${0XFFn}`;
export {};

//// [input.ts]
type Result = `x255`;
export {};
