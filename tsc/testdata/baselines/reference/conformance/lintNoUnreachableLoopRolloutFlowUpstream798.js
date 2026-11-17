//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream798.ts] ////

//// [input.ts]
function someFunc() { for (a; ; c) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (a; ; c) { try { return bar(); } catch (e) {} } }
