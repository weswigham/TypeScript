//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralConstituentsAliases.ts] ////

//// [input.ts]
type A = string; type B = A; type C = A | B;

//// [input.ts]
type A = string; type B = A; type C = A  ;
