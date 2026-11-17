//// [tests/cases/conformance/lint/rules/no-else-return/lintNoElseReturnRolloutReturnsRemovalFunctionRunValueIfReadyReturn1ElseLetValue2UseValue.ts] ////

//// [input.ts]
function run(value) { if (ready) return 1; else { let value = 2; use(value); } }

//// [input.ts]
function run(value) { if (ready) return 1; else { let value = 2; use(value); } }
