//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralConstituentsNested.ts] ////

//// [input.ts]
type A = string | (number | string);

//// [input.ts]
type A = string | (number  );
