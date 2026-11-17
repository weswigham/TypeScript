//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream505.ts] ////

//// [input.ts]
switch (foo) { case 1: break; var x; default: throw true; };

//// [input.ts]
switch (foo) { case 1: break; var x; default: throw true; };
