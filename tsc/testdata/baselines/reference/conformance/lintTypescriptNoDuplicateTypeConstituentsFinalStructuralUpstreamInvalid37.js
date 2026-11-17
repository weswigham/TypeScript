//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid37.ts] ////

//// [input.ts]
type fn = new (a?: string | undefined) => void;

//// [input.ts]
type fn = new (a?: string  ) => void;
