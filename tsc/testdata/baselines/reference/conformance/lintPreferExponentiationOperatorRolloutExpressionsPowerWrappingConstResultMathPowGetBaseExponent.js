//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowGetBaseExponent.ts] ////

//// [input.ts]
const result = Math.pow(getBase(), exponent);

//// [input.ts]
const result = getBase() ** exponent;
