//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1223.ts] ////

//// [input.ts]
for (a of b) { (() => a)() }

//// [input.ts]
for (a of b) { (() => a)() }
