//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream536.ts] ////

//// [input.ts]
while (true) { switch (foo) { case 1: continue; x = 1; } }

//// [input.ts]
while (true) { switch (foo) { case 1: continue; x = 1; } }
