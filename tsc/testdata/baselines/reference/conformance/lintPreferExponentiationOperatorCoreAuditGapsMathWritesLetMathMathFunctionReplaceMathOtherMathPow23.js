//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorCoreAuditGapsMathWritesLetMathMathFunctionReplaceMathOtherMathPow23.ts] ////

//// [input.ts]
let math = Math; function replace() { math = other; } math.pow(2, 3);

//// [input.ts]
let math = Math; function replace() { math = other; } math.pow(2, 3);
