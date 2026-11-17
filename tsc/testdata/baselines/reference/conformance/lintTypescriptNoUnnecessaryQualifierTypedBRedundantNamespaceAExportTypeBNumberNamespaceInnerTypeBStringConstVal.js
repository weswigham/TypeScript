//// [tests/cases/conformance/lint/rules/no-unnecessary-qualifier/lintTypescriptNoUnnecessaryQualifierTypedBRedundantNamespaceAExportTypeBNumberNamespaceInnerTypeBStringConstVal.ts] ////

//// [input.ts]
namespace A { export type B = number; namespace Inner { type B = string; const value: A.B = 3; } }

//// [input.ts]
namespace A { export type B = number; namespace Inner { type B = string; const value: A.B = 3; } }
