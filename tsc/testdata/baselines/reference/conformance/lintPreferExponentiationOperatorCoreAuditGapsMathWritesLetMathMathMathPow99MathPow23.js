//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorCoreAuditGapsMathWritesLetMathMathMathPow99MathPow23.ts] ////

//// [input.ts]
let math = Math; math = { pow: () => 99 }; math.pow(2, 3);

//// [input.ts]
let math = Math; math = { pow: () => 99 }; math.pow(2, 3);
