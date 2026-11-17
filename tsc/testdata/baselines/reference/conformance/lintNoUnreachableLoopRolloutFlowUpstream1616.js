//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1616.ts] ////

//// [input.ts]
for (a; ; c) { for (; b;); break; }

//// [input.ts]
for (a; ; c) { for (; b;); break; }
