//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingMathPowValue2ValueExponent.ts] ////

//// [input.ts]
Math.pow({value: 2}.value, exponent);

//// [input.ts]
({value: 2}.value ** exponent);
