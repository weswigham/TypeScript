//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream468.ts] ////

//// [input.ts]
var foo = 0, bar = 1, baz = 2; while (foo ? bar : baz) { foo += 1; }

//// [input.ts]
var foo = 0, bar = 1, baz = 2; while (foo ? bar : baz) { foo += 1; }
