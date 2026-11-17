//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2024.ts] ////

//// [input.ts]
for (let a in f(b)) { for(;;) if (foo) break; break; }

//// [input.ts]
for (let a in f(b)) { for(;;) if (foo) break; break; }
