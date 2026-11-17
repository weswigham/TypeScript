//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingAsyncFunctionRunReturnMathPowAwaitBaseExponent.ts] ////

//// [input.ts]
async function run() { return Math.pow(await base, exponent); }

//// [input.ts]
async function run() { return (await base) ** exponent; }
