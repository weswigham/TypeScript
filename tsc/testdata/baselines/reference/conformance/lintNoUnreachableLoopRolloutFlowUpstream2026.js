//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2026.ts] ////

//// [input.ts]
for (let a in f(b)) { for (a of b); break; }

//// [input.ts]
for (let a in f(b)) { for (a of b); break; }
