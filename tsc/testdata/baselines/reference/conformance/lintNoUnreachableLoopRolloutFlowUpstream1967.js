//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1967.ts] ////

//// [input.ts]
for (a in f(b)) { for (a in b); break; }

//// [input.ts]
for (a in f(b)) { for (a in b); break; }
