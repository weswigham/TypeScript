//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1631.ts] ////

//// [input.ts]
for (a = 0; ; c++) { break; foo(); }

//// [input.ts]
for (a = 0; ; c++) { break; foo(); }
