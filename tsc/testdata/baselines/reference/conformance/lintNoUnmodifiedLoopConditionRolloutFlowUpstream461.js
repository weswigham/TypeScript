//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream461.ts] ////

//// [input.ts]
var foo = 0, f = {}; while (foo === f()) { }

//// [input.ts]
var foo = 0, f = {}; while (foo === f()) { }
