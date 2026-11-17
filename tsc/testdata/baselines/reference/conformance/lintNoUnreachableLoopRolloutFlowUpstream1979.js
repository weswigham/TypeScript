//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1979.ts] ////

//// [input.ts]
for (var a in b) { break; foo(); }

//// [input.ts]
for (var a in b) { break; foo(); }
