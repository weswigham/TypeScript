//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2083.ts] ////

//// [input.ts]
for (a of f(b)) { for (a in b); break; }

//// [input.ts]
for (a of f(b)) { for (a in b); break; }
