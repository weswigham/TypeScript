//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2204.ts] ////

//// [input.ts]
function foo() { switch(foo) { case 0: a(); return; case 1: b(); }; }

//// [input.ts]
function foo() { switch(foo) { case 0: a(); return; case 1: b(); }; }
