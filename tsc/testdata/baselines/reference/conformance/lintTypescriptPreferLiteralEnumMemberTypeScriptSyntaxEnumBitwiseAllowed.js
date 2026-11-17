//// [tests/cases/conformance/lint/rules/prefer-literal-enum-member/lintTypescriptPreferLiteralEnumMemberTypeScriptSyntaxEnumBitwiseAllowed.ts] ////

//// [input.ts]
enum E { A = 1 << 0, B = 2, C = A | E.B }

//// [input.ts]
enum E { A = 1 << 0, B = 2, C = A | E.B }
