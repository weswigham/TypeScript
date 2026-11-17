//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2164.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { while (a); break; } }

//// [input.ts]
async function foo() { for await (const a of b) { while (a); break; } }
