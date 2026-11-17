//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1814.ts] ////

//// [input.ts]
for (; b < foo; ) { () => a; break; }

//// [input.ts]
for (; b < foo; ) { () => a; break; }
