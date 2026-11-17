//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowDeleteObjectBaseExponent.ts] ////

//// [input.ts]
const result = Math.pow(delete object.base, exponent);

//// [input.ts]
const result = (delete object.base) ** exponent;
