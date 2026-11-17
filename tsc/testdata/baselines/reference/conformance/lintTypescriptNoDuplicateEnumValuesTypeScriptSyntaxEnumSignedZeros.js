//// [tests/cases/conformance/lint/rules/no-duplicate-enum-values/lintTypescriptNoDuplicateEnumValuesTypeScriptSyntaxEnumSignedZeros.ts] ////

//// [input.ts]
enum E { A = -0, B = +0, C = 0, D = -0 }

//// [input.ts]
enum E { A = -0, B = +0, C = 0, D = -0 }
