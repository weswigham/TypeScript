//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream463.ts] ////

//// [input.ts]
function* foo() { var foo = 0; while (yield foo) { } }

//// [input.ts]
function* foo() { var foo = 0; while (yield foo) { } }
