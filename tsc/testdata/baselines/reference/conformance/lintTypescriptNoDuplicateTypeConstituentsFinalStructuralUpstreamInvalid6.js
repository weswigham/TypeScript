//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid6.ts] ////

//// [input.ts]
type T = { a: string; b: number } | { a: string; b: number };

//// [input.ts]
type T = { a: string; b: number }  ;
