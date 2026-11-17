//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e6Type.ts] ////

//// [input.ts]
type Result = `x${1e-6}`;
export {};

//// [input.ts]
type Result = `x0.000001`;
export {};
