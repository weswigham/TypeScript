//// [tests/cases/conformance/lint/rules/prefer-as-const/lintTypescriptPreferAsConstTypeScriptSyntaxAsConstFix.ts] ////

//// [input.ts]
const value = 'a' as 'a';

//// [input.ts]
const value = 'a' as const;
