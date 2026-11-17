//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultFirstMathPowBaseExponentCase2.ts] ////

//// [input.ts]
const result = first+Math.pow(++base, exponent);

//// [input.ts]
const result = first+ ++base ** exponent;
