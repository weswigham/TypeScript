//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultCallMathPowBaseExponent.ts] ////

//// [input.ts]
const result = call(Math.pow(base, exponent));

//// [input.ts]
const result = call(base ** exponent);
