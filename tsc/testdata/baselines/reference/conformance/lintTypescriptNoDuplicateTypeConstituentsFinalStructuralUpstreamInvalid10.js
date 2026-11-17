//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid10.ts] ////

//// [input.ts]
type T = string[][] | string[][];

//// [input.ts]
type T = string[][]  ;
