//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1968.ts] ////

//// [input.ts]
for (a in f(b)) { for (a of b); break; }

//// [input.ts]
for (a in f(b)) { for (a of b); break; }
