//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorCoreAuditGapsMathWritesConstPowerMathPowPower23.ts] ////

//// [input.ts]
const power = Math.pow; power(2, 3);

//// [input.ts]
const power = Math.pow; 2 ** 3;
