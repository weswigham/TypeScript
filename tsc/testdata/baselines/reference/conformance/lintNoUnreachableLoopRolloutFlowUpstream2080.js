//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2080.ts] ////

//// [input.ts]
for (a of f(b)) { for (; b;); break; }

//// [input.ts]
for (a of f(b)) { for (; b;); break; }
