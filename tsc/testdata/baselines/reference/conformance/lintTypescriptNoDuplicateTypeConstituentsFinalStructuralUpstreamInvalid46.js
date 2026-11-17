//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid46.ts] ////

//// [input.ts]
type fn = (a?: (undefined | number) | string) => void;

//// [input.ts]
type fn = (a?: (  number) | string) => void;
