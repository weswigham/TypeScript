//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2078.ts] ////

//// [input.ts]
for (a of f(b)) { do ; while (a) break; }

//// [input.ts]
for (a of f(b)) { do ; while (a) break; }
