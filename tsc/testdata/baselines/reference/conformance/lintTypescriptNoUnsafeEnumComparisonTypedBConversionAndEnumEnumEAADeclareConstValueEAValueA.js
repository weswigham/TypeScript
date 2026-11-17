//// [tests/cases/conformance/lint/rules/no-unsafe-enum-comparison/lintTypescriptNoUnsafeEnumComparisonTypedBConversionAndEnumEnumEAADeclareConstValueEAValueA.ts] ////

//// [input.ts]
enum E { A = 'a' } declare const value: E | 'a'; value === 'a';

//// [input.ts]
enum E { A = 'a' } declare const value: E | 'a'; value === 'a';
