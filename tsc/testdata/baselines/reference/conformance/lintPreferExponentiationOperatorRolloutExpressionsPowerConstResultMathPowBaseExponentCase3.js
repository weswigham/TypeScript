//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerConstResultMathPowBaseExponentCase3.ts] ////

//// [input.ts]
const result = Math['p' + 'ow'](base, exponent);

//// [input.ts]
const result = base ** exponent;
