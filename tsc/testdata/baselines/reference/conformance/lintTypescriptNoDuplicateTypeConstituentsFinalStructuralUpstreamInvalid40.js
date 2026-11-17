//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid40.ts] ////

//// [input.ts]
declare function f(a?: string | undefined): void;

//// [input.ts]
declare function f(a?: string  ): void;
