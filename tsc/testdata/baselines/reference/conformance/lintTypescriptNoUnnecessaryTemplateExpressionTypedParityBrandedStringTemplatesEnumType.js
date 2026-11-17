//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityBrandedStringTemplatesEnumType.ts] ////

//// [input.ts]
enum E { A = 'a' } type S = E & { brand: true }; type R = `${S}`;
export {};

//// [input.ts]
enum E { A = 'a' } type S = E & { brand: true }; type R = `${S}`;
export {};
