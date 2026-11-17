//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2265.ts] ////

//// [input.ts]
switch(foo) { case 0: a();
/* no break */
/* todo: fix readability */
default: b() }

//// [input.ts]
switch(foo) { case 0: a();
/* no break */
/* todo: fix readability */
default: b() }
