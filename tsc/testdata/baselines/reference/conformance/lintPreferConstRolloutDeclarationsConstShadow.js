//// [tests/cases/conformance/lint/rules/prefer-const/lintPreferConstRolloutDeclarationsConstShadow.ts] ////

//// [input.ts]
let x = 1; function f() { let x = 2; x++; }

//// [input.ts]
const x = 1; function f() { let x = 2; x++; }
