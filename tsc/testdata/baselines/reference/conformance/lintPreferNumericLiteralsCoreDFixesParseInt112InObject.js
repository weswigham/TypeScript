//// [tests/cases/conformance/lint/rules/prefer-numeric-literals/lintPreferNumericLiteralsCoreDFixesParseInt112InObject.ts] ////

//// [input.tsx]
parseInt('11', 2)in object;

//// [input.tsx]
0b11 in object;
