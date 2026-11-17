//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1615.ts] ////

//// [input.ts]
for (a; ; c) { for (a; b; c); break; }

//// [input.ts]
for (a; ; c) { for (a; b; c); break; }
