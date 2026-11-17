//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorCoreAuditGapsMathWritesFunctionFMathMathOtherMathPow23.ts] ////

//// [input.ts]
function f(Math) { Math = other; } Math.pow(2, 3);

//// [input.ts]
function f(Math) { Math = other; } 2 ** 3;
