//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1931.ts] ////

//// [input.ts]
for (a in b) { (() => a)(); break; }

//// [input.ts]
for (a in b) { (() => a)(); break; }
