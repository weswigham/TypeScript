//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2234.ts] ////

//// [input.ts]
switch(foo) { case 0: a();
// need to execute b(), so
// falling through
 case 1: b(); }

//// [input.ts]
switch(foo) { case 0: a();
// need to execute b(), so
// falling through
 case 1: b(); }
