//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2084.ts] ////

//// [input.ts]
for (a of f(b)) { for (a of b); break; }

//// [input.ts]
for (a of f(b)) { for (a of b); break; }
