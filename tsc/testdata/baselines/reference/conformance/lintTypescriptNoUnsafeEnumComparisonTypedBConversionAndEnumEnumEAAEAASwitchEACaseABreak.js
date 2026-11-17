//// [tests/cases/conformance/lint/rules/no-unsafe-enum-comparison/lintTypescriptNoUnsafeEnumComparisonTypedBConversionAndEnumEnumEAAEAASwitchEACaseABreak.ts] ////

//// [input.ts]
enum E { A = 'a' } E.A === 'a'; switch (E.A) { case 'a': break; }

//// [input.ts]
enum E { A = 'a' } E.A === 'a'; switch (E.A) { case 'a': break; }
