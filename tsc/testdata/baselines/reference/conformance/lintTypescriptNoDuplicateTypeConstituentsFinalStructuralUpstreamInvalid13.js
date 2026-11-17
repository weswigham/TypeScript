//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid13.ts] ////

//// [input.ts]
type T = () => null | null;

//// [input.ts]
type T = () => null  ;
