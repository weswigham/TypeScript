//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1757.ts] ////

//// [input.ts]
for (; ; c++) { (() => a)(); break; }

//// [input.ts]
for (; ; c++) { (() => a)(); break; }
