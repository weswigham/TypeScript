//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowObjectBaseExponent.ts] ////

//// [input.ts]
const result = Math.pow(object.base, exponent);

//// [input.ts]
const result = object.base ** exponent;
