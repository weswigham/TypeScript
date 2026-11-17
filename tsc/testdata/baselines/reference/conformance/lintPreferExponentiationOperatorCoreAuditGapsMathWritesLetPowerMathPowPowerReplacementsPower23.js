//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorCoreAuditGapsMathWritesLetPowerMathPowPowerReplacementsPower23.ts] ////

//// [input.ts]
let power = Math.pow; [power] = replacements; power(2, 3);

//// [input.ts]
let power = Math.pow; [power] = replacements; power(2, 3);
