//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1872.ts] ////

//// [input.ts]
for (a = 0; ;) { () => a; break; }

//// [input.ts]
for (a = 0; ;) { () => a; break; }
