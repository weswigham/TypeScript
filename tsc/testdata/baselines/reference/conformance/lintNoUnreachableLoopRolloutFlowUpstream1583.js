//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1583.ts] ////

//// [input.ts]
for (; b < foo; c++) { (() => a)(); break; }

//// [input.ts]
for (; b < foo; c++) { (() => a)(); break; }
