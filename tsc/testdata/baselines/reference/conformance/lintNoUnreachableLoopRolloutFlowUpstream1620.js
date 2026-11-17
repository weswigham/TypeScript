//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1620.ts] ////

//// [input.ts]
for (a; ; c) { for (a of b); break; }

//// [input.ts]
for (a; ; c) { for (a of b); break; }
