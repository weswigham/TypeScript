//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowContinueIteration.ts] ////

//// [input.ts]
for (const x of xs) { if (x) continue; break; }

//// [input.ts]
for (const x of xs) { if (x) continue; break; }
