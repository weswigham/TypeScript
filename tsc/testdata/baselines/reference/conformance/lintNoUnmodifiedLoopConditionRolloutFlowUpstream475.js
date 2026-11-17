//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream475.ts] ////

//// [input.ts]
var foo = 0, bar = 0; for (bar; foo;) { ++foo }

//// [input.ts]
var foo = 0, bar = 0; for (bar; foo;) { ++foo }
