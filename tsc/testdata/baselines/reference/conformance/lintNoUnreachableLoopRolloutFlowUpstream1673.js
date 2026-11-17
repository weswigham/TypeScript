//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1673.ts] ////

//// [input.ts]
for (a; b;) { for (a; b; c); break; }

//// [input.ts]
for (a; b;) { for (a; b; c); break; }
