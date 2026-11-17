//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1572.ts] ////

//// [input.ts]
for (; b < foo; c++) { foo(); break; }

//// [input.ts]
for (; b < foo; c++) { foo(); break; }
