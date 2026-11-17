//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream464.ts] ////

//// [input.ts]
function* foo() { var foo = 0; while (foo === (yield)) { } }

//// [input.ts]
function* foo() { var foo = 0; while (foo === (yield)) { } }
