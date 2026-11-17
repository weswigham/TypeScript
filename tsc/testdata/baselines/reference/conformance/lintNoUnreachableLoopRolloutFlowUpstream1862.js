//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1862.ts] ////

//// [input.ts]
for (a = 0; ;) { foo(); break; }

//// [input.ts]
for (a = 0; ;) { foo(); break; }
