//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2177.ts] ////

//// [input.ts]
for (a in b) { while (foo) { if(baz) { break; } else { break; } } break; }

//// [input.ts]
for (a in b) { while (foo) { if(baz) { break; } else { break; } } break; }
