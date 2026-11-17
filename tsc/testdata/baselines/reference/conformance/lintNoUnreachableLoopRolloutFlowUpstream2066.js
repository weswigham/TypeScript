//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2066.ts] ////

//// [input.ts]
for (a of f(b)) { break; foo(); }

//// [input.ts]
for (a of f(b)) { break; foo(); }
