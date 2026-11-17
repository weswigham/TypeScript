//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorCoreAuditGapsMathWritesMathMathPow99ConsoleLogMathPow23.ts] ////

//// [input.ts]
Math = { ...Math, pow: () => 99 }; console.log(Math.pow(2, 3));

//// [input.ts]
Math = { ...Math, pow: () => 99 }; console.log(Math.pow(2, 3));
