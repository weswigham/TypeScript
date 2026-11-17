//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowBaseExponentOtherCase2.ts] ////

//// [input.ts]
const result = Math.pow(base, exponent = other);

//// [input.ts]
const result = base ** (exponent = other);
