//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingClassResultExtendsMathPowBaseExponent.ts] ////

//// [input.ts]
class Result extends Math.pow(base, exponent) {}

//// [input.ts]
class Result extends (base ** exponent) {}
