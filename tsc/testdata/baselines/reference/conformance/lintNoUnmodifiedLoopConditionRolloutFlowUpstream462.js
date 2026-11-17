//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream462.ts] ////

//// [input.ts]
var foo = 0, tag = 0; while (foo === tag`abc`) { }

//// [input.ts]
var foo = 0, tag = 0; while (foo === tag`abc`) { }
