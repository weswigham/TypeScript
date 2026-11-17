//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2136.ts] ////

//// [input.ts]
for (var a of f(b)) { do ; while (a) break; }

//// [input.ts]
for (var a of f(b)) { do ; while (a) break; }
