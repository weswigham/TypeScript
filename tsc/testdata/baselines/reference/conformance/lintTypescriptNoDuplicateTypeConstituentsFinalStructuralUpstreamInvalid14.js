//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid14.ts] ////

//// [input.ts]
type T = (arg: string | string) => void;

//// [input.ts]
type T = (arg: string  ) => void;
