//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamValid6.ts] ////

//// [input.ts]
type T = { a: string; b: number } | { b: number; a: string };

//// [input.ts]
type T = { a: string; b: number } | { b: number; a: string };
