//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorCoreAuditGapsMathWritesConstPowPowerMathPower23.ts] ////

//// [input.ts]
const {pow: power} = Math; power(2, 3);

//// [input.ts]
const {pow: power} = Math; 2 ** 3;
