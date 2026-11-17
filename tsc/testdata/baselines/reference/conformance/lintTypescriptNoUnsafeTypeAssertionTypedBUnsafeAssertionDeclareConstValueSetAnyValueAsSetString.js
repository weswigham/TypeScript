//// [tests/cases/conformance/lint/rules/no-unsafe-type-assertion/lintTypescriptNoUnsafeTypeAssertionTypedBUnsafeAssertionDeclareConstValueSetAnyValueAsSetString.ts] ////

//// [input.ts]
declare const value: Set<any>; value as Set<string>;

//// [input.ts]
declare const value: Set<any>; value as Set<string>;
