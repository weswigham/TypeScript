//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream691.ts] ////

//// [input.ts]
for (a; b; c) { (() => a)() }

//// [input.ts]
for (a; b; c) { (() => a)() }
