//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2154.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) if (foo) break; else return; }

//// [input.ts]
async function foo() { for await (const a of b) if (foo) break; else return; }
