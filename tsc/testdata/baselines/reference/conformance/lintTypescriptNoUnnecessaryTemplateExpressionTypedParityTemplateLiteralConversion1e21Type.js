//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1e21Type.ts] ////

//// [input.ts]
type Result = `x${1e21}`;
export {};

//// [input.ts]
type Result = `x1e+21`;
export {};
