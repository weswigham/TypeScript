//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowBaseExponentOtherCase3.ts] ////

//// [input.ts]
const result = Math.pow(base, exponent) ** other;

//// [input.ts]
const result = (base ** exponent) ** other;
