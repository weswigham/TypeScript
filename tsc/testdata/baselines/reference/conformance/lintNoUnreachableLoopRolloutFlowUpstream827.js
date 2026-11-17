//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream827.ts] ////

//// [input.ts]
for (a = 0; ; c++) { continue; break; }

//// [input.ts]
for (a = 0; ; c++) { continue; break; }
