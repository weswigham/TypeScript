//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityBrandedStringTemplatesNumberUnion.ts] ////

//// [input.ts]
declare const s: (string & { brand: true }) | number; const r = `${s}`;
export {};

//// [input.ts]
declare const s: (string & { brand: true }) | number; const r = `${s}`;
export {};
