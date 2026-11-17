//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2047.ts] ////

//// [input.ts]
for (a of b) { (() => a)(); break; }

//// [input.ts]
for (a of b) { (() => a)(); break; }
