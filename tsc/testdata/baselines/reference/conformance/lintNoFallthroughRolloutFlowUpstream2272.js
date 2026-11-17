//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2272.ts] ////

//// [input.ts]
switch (foo) { case 0: a(); 
// eslint-enable no-fallthrough
 case 1: }

//// [input.ts]
switch (foo) { case 0: a(); 
// eslint-enable no-fallthrough
 case 1: }
