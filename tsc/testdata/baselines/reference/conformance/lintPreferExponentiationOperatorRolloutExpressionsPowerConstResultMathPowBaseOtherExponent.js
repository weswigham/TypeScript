//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerConstResultMathPowBaseOtherExponent.ts] ////

//// [input.ts]
const result = Math.pow(base ** other, exponent);

//// [input.ts]
const result = (base ** other) ** exponent;
