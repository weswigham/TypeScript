//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid4.ts] ////

//// [input.ts]
type T = { a: string | string };

//// [input.ts]
type T = { a: string   };
