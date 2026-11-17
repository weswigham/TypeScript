//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion0x10nType.ts] ////

//// [input.ts]
type Result = `x${0x10n}`;
export {};

//// [input.ts]
type Result = `x16`;
export {};
