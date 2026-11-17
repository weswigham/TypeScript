//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream859.ts] ////

//// [input.ts]
for (a; b;) { (() => a)() }

//// [input.ts]
for (a; b;) { (() => a)() }
