//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityBrandedStringTemplatesBrandedType.ts] ////

//// [input.ts]
type S = string & { brand: true }; type R = `${S}`;
export {};

//// [input.ts]
type S = string & { brand: true }; type R = S;
export {};
