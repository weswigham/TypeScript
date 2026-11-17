//// [tests/cases/conformance/lint/rules/no-unnecessary-qualifier/lintTypescriptNoUnnecessaryQualifierTypedBRedundantNamespaceAExportTypeBNumberConstValueAB3.ts] ////

//// [input.ts]
namespace A { export type B = number; const value: A.B = 3; }

//// [input.ts]
namespace A { export type B = number; const value: B = 3; }
