//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion12345678901234568e21Type.ts] ////

//// [input.ts]
type Result = `x${1.2345678901234568e21}`;
export {};

//// [input.ts]
type Result = `x1.2345678901234568e+21`;
export {};
