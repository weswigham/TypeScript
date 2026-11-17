//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralConstituentsOptional.ts] ////

//// [input.ts]
function f(x?: string | undefined) {}

//// [input.ts]
function f(x?: string  ) {}
