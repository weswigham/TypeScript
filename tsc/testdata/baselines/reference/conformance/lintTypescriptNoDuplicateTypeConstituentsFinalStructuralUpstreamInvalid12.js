//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid12.ts] ////

//// [input.ts]
type T = () => string | string;

//// [input.ts]
type T = () => string  ;
