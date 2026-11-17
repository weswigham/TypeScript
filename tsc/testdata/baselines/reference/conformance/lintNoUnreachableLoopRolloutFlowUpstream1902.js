//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1902.ts] ////

//// [input.ts]
for (;;) { (() => a)(); break; }

//// [input.ts]
for (;;) { (() => a)(); break; }
