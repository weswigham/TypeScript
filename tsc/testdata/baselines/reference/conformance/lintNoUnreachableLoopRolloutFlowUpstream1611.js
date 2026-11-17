//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1611.ts] ////

//// [input.ts]
for (a; ; c) { () => a; break; }

//// [input.ts]
for (a; ; c) { () => a; break; }
