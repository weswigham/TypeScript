//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralConstituentsDistinctAST.ts] ////

//// [input.ts]
type A = { x: string; y: number } | { y: number; x: string };

//// [input.ts]
type A = { x: string; y: number } | { y: number; x: string };
