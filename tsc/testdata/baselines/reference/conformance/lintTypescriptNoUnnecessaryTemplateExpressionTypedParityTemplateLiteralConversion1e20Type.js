//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e20Type.ts] ////

//// [input.ts]
type Result = `x${1e20}`;
export {};

//// [input.ts]
type Result = `x100000000000000000000`;
export {};
