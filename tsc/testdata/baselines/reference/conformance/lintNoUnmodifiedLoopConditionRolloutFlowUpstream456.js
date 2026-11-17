//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream456.ts] ////

//// [input.ts]
var foo = 0; while (foo = next()) { }

//// [input.ts]
var foo = 0; while (foo = next()) { }
