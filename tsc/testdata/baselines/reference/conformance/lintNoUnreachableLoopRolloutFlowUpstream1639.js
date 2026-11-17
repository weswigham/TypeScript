//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1639.ts] ////

//// [input.ts]
for (a = 0; ; c++) { break; continue; }

//// [input.ts]
for (a = 0; ; c++) { break; continue; }
