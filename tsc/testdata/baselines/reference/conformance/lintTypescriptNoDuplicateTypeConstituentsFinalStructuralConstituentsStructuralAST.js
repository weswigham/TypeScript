//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralConstituentsStructuralAST.ts] ////

//// [input.ts]
type A = { x: string } | { x: string };

//// [input.ts]
type A = { x: string }  ;
