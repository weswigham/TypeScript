//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultObjectMathPowBaseExponent.ts] ////

//// [input.ts]
const result = object[Math.pow(base, exponent)];

//// [input.ts]
const result = object[base ** exponent];
