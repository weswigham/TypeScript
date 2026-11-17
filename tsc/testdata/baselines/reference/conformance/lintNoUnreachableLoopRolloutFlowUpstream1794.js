//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1794.ts] ////

//// [input.ts]
for (; b;) { for (a of b); break; }

//// [input.ts]
for (; b;) { for (a of b); break; }
