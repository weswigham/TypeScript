//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid7.ts] ////

//// [input.ts]
type T = Set<string> | Set<string>;

//// [input.ts]
type T = Set<string>  ;
