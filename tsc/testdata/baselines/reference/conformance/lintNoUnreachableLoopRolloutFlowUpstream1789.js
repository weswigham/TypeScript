//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1789.ts] ////

//// [input.ts]
for (; b;) { for (a; b; c); break; }

//// [input.ts]
for (; b;) { for (a; b; c); break; }
