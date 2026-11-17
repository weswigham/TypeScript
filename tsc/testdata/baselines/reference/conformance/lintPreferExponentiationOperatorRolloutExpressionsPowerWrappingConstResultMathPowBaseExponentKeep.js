//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowBaseExponentKeep.ts] ////

//// [input.ts]
const result = Math.pow(base, exponent) /* keep */;

//// [input.ts]
const result = base ** exponent /* keep */;
