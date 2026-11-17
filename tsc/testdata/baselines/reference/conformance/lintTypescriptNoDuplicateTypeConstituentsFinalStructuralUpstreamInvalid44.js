//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid44.ts] ////

//// [input.ts]
type fn = (a?: string | undefined) => void;

//// [input.ts]
type fn = (a?: string  ) => void;
