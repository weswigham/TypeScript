//// [tests/cases/conformance/lint/rules/no-unnecessary-template-expression/lintTypescriptNoUnnecessaryTemplateExpressionTypedParityBrandedStringTemplatesGenericConstraint.ts] ////

//// [input.ts]
function f<T extends string & { brand: true }>(s: T) { return `${s}`; }
export {};

//// [input.ts]
function f<T extends string & { brand: true }>(s: T) { return s; }
export {};
