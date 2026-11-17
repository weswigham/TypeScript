//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e400Type.ts] ////

//// [input.ts]
type Result = `x${1e-400}`;
export {};

//// [input.ts]
type Result = `x0`;
export {};
