//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream490.ts] ////

//// [input.ts]
let foo = 0, bar = 1, baz = 2; while (foo ? bar : baz) { foo += 1; }

//// [input.ts]
let foo = 0, bar = 1, baz = 2; while (foo ? bar : baz) { foo += 1; }
