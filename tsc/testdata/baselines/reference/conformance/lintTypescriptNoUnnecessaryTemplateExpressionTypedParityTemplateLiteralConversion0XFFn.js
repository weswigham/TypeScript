//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion0XFFn.ts] ////

//// [input.ts]
const result = `x${0XFFn}`;
export {};

//// [input.ts]
const result = `x255`;
export {};
