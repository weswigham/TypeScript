//// [tests/cases/conformance/lint/rules/eqeqeq/lintEqeqeqCoreSyntaxAEqualityFix.ts] ////

//// [input.ts]
typeof value == 'string'; 1 != 2;

//// [input.ts]
typeof value === 'string'; 1 !== 2;
