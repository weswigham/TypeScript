//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultKeepMathPowBaseExponent.ts] ////

//// [input.ts]
const result = /* keep */ Math.pow(base, exponent);

//// [input.ts]
const result = /* keep */ base ** exponent;
