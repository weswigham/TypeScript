//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream470.ts] ////

//// [input.ts]
var foo = 0, bar = 0; while (foo || bar) { ++foo; ++bar; }

//// [input.ts]
var foo = 0, bar = 0; while (foo || bar) { ++foo; ++bar; }
