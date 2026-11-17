//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2168.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { for (; ; c) if (foo) break; break; } }

//// [input.ts]
async function foo() { for await (const a of b) { for (; ; c) if (foo) break; break; } }
