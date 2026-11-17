//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1735.ts] ////

//// [input.ts]
for (; ; c) { for (a in b); break; }

//// [input.ts]
for (; ; c) { for (a in b); break; }
