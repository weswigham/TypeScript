//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid33.ts] ////

//// [input.ts]
type T = A | A | string | string;

//// [input.ts]
type T = A | A | string  ;
