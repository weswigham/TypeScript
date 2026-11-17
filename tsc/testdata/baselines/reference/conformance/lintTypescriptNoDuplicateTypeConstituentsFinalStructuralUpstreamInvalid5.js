//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid5.ts] ////

//// [input.ts]
type T = { a: string } | { a: string };

//// [input.ts]
type T = { a: string }  ;
