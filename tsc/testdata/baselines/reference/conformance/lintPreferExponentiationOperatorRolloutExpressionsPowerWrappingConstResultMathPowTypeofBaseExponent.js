//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowTypeofBaseExponent.ts] ////

//// [input.ts]
const result = Math.pow(typeof base, exponent);

//// [input.ts]
const result = (typeof base) ** exponent;
