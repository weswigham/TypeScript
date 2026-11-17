//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityBrandedStringTemplatesNonStringIntersection.ts] ////

//// [input.ts]
declare const s: number & { brand: true }; const r = `${s}`;
export {};

//// [input.ts]
declare const s: number & { brand: true }; const r = `${s}`;
export {};
