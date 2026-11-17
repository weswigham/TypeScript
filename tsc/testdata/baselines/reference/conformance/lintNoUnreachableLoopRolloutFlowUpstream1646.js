//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1646.ts] ////

//// [input.ts]
for (a = 0; ; c++) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (a = 0; ; c++) { for (; ; c) if (foo) break; break; }
