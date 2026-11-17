//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUnmodified.ts] ////

//// [input.ts]
function f() { let n = 2; while (n > 0) { work(); } }

//// [input.ts]
function f() { let n = 2; while (n > 0) { work(); } }
