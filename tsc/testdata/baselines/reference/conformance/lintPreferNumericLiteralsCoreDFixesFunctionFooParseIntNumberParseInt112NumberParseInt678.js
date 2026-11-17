//// [tests/cases/conformance/lint/rules/prefer-numeric-literals/lintPreferNumericLiteralsCoreDFixesFunctionFooParseIntNumberParseInt112NumberParseInt678.ts] ////

//// [input.tsx]
function foo(parseInt, Number) { parseInt('11', 2); Number.parseInt('67', 8); }

//// [input.tsx]
function foo(parseInt, Number) { parseInt('11', 2); Number.parseInt('67', 8); }
