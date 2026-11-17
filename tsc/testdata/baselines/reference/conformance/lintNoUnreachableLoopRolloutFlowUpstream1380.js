//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1380.ts] ////

//// [input.ts]
while (a) { (() => a)(); break; }

//// [input.ts]
while (a) { (() => a)(); break; }
