//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1055.ts] ////

//// [input.ts]
for (a = 0; ;) { (() => a)() }

//// [input.ts]
for (a = 0; ;) { (() => a)() }
