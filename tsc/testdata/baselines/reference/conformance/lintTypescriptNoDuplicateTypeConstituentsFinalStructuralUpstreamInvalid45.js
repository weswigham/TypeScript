//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid45.ts] ////

//// [input.ts]
type fn = (a?: string | (undefined | number)) => void;

//// [input.ts]
type fn = (a?: string | (  number)) => void;
