//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2169.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { for(;;) if (foo) break; break; } }

//// [input.ts]
async function foo() { for await (const a of b) { for(;;) if (foo) break; break; } }
