//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream498.ts] ////

//// [input.ts]
while (true) { switch (foo) { case 1: x = 1; x = 2;} }

//// [input.ts]
while (true) { switch (foo) { case 1: x = 1; x = 2;} }
