//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2236.ts] ////

//// [input.ts]
switch(foo) { case 0: a(); /* caution: break is omitted intentionally */ case 1: b(); /* break omitted */ default: c(); }

//// [input.ts]
switch(foo) { case 0: a(); /* caution: break is omitted intentionally */ case 1: b(); /* break omitted */ default: c(); }
