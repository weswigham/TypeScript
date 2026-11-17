//// [tests/cases/conformance/lint/rules/prefer-numeric-literals/lintPreferNumericLiteralsCoreDFixesFunctionFooYieldNumberParseInt112.ts] ////

//// [input.tsx]
function* foo() { yield(Number).parseInt('11', 2); }

//// [input.tsx]
function* foo() { yield 0b11; }
