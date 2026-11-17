//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1361.ts] ////

//// [input.ts]
for (var key in obj) { hasEnumerableProperties = true; break; } for (const a of b) break;

//// [input.ts]
for (var key in obj) { hasEnumerableProperties = true; break; } for (const a of b) break;
