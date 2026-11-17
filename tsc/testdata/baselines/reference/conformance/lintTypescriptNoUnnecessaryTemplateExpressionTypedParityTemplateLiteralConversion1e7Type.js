//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e7Type.ts] ////

//// [input.ts]
type Result = `x${1e-7}`;
export {};

//// [input.ts]
type Result = `x1e-7`;
export {};
