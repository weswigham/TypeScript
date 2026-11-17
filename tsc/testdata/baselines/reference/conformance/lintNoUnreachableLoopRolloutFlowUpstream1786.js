//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1786.ts] ////

//// [input.ts]
for (; b;) { (() => a)(); break; }

//// [input.ts]
for (; b;) { (() => a)(); break; }
