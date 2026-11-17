//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityBrandedStringTemplatesGenericType.ts] ////

//// [input.ts]
type R<T extends string & { brand: true }> = `${T}`;
export {};

//// [input.ts]
type R<T extends string & { brand: true }> = `${T}`;
export {};
