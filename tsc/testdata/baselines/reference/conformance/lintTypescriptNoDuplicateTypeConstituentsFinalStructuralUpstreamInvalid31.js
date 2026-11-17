//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid31.ts] ////

//// [input.ts]
type A = number & string & (number & string);

//// [input.ts]
type A = number & string & (  );
