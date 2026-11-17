//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e309Type.ts] ////

//// [input.ts]
type Result = `x${1e309}`;
export {};

//// [input.ts]
type Result = `xInfinity`;
export {};
