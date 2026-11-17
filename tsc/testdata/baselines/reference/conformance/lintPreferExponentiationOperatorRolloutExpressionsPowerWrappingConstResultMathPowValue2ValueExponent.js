//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowValue2ValueExponent.ts] ////

//// [input.ts]
const result = Math.pow({value: 2}.value, exponent);

//// [input.ts]
const result = {value: 2}.value ** exponent;
