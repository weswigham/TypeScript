//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream491.ts] ////

//// [input.ts]
let chunk = true, done = false; while (chunk ? !done : false) { chunk = nextOrNull(); }

//// [input.ts]
let chunk = true, done = false; while (chunk ? !done : false) { chunk = nextOrNull(); }
