//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1588.ts] ////

//// [input.ts]
for (; b < foo; c++) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (; b < foo; c++) { for (; ; c) if (foo) break; break; }
