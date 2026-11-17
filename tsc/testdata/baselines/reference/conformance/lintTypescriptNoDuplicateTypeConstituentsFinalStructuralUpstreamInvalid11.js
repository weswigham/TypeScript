//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid11.ts] ////

//// [input.ts]
type T = [1, 2, 3] | [1, 2, 3];

//// [input.ts]
type T = [1, 2, 3]  ;
