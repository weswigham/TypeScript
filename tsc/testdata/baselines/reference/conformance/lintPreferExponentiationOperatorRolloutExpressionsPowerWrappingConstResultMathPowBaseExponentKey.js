//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowBaseExponentKey.ts] ////

//// [input.ts]
const result = Math.pow(base, exponent)[key];

//// [input.ts]
const result = (base ** exponent)[key];
