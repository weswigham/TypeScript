//// [tests/cases/conformance/lint/rules/no-duplicate-enum-values/lintTypescriptNoDuplicateEnumValuesTypeScriptSyntaxEnumCoercion.ts] ////

//// [input.ts]
enum E { A = +'1e2', B = 100, C = -+1, D = +-1 }

//// [input.ts]
enum E { A = +'1e2', B = 100, C = -+1, D = +-1 }
