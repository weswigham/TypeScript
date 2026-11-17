//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1554.ts] ////

//// [input.ts]
for (; b; c) { (() => a)(); break; }

//// [input.ts]
for (; b; c) { (() => a)(); break; }
