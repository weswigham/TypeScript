//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2075.ts] ////

//// [input.ts]
for (a of f(b)) { () => a; break; }

//// [input.ts]
for (a of f(b)) { () => a; break; }
