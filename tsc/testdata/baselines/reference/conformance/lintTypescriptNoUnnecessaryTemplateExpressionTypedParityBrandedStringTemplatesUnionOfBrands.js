//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityBrandedStringTemplatesUnionOfBrands.ts] ////

//// [input.ts]
declare const s: (string & { a: true }) | (string & { b: true }); const r = `${s}`;
export {};

//// [input.ts]
declare const s: (string & { a: true }) | (string & { b: true }); const r = s;
export {};
