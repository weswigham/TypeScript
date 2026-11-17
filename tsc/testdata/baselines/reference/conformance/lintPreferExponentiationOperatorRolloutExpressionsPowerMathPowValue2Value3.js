//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerMathPowValue2Value3.ts] ////

//// [input.ts]
Math.pow({value: 2}.value, 3);

//// [input.ts]
({value: 2}.value ** 3);
