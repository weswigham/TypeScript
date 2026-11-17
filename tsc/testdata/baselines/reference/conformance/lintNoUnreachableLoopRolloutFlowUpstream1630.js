//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1630.ts] ////

//// [input.ts]
for (a = 0; ; c++) { foo(); break; }

//// [input.ts]
for (a = 0; ; c++) { foo(); break; }
