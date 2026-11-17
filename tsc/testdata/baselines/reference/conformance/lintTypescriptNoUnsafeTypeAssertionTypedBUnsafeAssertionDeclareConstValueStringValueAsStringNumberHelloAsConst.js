//// [tests/cases/conformance/lint/rules/no-unsafe-type-assertion/lintTypescriptNoUnsafeTypeAssertionTypedBUnsafeAssertionDeclareConstValueStringValueAsStringNumberHelloAsConst.ts] ////

//// [input.ts]
declare const value: string; value as string | number; 'hello' as const;

//// [input.ts]
declare const value: string; value as string | number; 'hello' as const;
