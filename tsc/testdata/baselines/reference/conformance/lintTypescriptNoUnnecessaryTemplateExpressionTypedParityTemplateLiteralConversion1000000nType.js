//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityTemplateLiteralConversion1000000nType.ts] ////

//// [input.ts]
type Result = `x${1_000_000n}`;
export {};

//// [input.ts]
type Result = `x1000000`;
export {};
