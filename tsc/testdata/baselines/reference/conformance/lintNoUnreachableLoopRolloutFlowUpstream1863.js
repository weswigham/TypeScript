//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1863.ts] ////

//// [input.ts]
for (a = 0; ;) { break; foo(); }

//// [input.ts]
for (a = 0; ;) { break; foo(); }
