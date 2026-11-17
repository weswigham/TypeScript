//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1844.ts] ////

//// [input.ts]
for (a; ;) { (() => a)(); break; }

//// [input.ts]
for (a; ;) { (() => a)(); break; }
