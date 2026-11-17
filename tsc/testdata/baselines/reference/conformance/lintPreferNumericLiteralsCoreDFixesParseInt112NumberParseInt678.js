//// [tests/cases/conformance/lint/rules/prefer-numeric-literals/lintPreferNumericLiteralsCoreDFixesParseInt112NumberParseInt678.ts] ////

//// [input.tsx]
parseInt('11', 2); Number.parseInt(`67`, 8);

//// [input.tsx]
0b11; 0o67;
