//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1640.ts] ////

//// [input.ts]
for (a = 0; ; c++) { () => a; break; }

//// [input.ts]
for (a = 0; ; c++) { () => a; break; }
