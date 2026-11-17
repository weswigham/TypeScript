//// [tests/cases/conformance/lint/rules/no-unnecessary-qualifier/lintTypescriptNoUnnecessaryQualifierTypedBRedundantEnumEABEA.ts] ////

//// [input.ts]
enum E { A, B = E.A }

//// [input.ts]
enum E { A, B = A }
