//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityBrandedStringTemplatesBranded.ts] ////

//// [input.ts]
declare const s: string & { brand: true }; const r = `${s}`;
export {};

//// [input.ts]
declare const s: string & { brand: true }; const r = s;
export {};
