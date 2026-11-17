//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid29.ts] ////

//// [input.ts]
type A = (number | (string | null)) | (string | (null | number));

//// [input.ts]
type A = (number | (string | null))  ;
