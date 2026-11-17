//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1496.ts] ////

//// [input.ts]
for (a; b; c) { (() => a)(); break; }

//// [input.ts]
for (a; b; c) { (() => a)(); break; }
