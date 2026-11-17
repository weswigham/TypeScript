//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2166.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { for (a; b; c); break; } }

//// [input.ts]
async function foo() { for await (const a of b) { for (a; b; c); break; } }
