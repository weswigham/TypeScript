//// [tests/cases/conformance/lint/rules/no-else-return/lintNoElseReturnRolloutReturnsRemovalFunctionRunIfReadyReturn1ElseLetValue2UseValue.ts] ////

//// [input.ts]
function run() { if (ready) return 1; else { let value = 2; use(value); } }

//// [input.ts]
function run() { if (ready) return 1;  let value = 2; use(value);  }
