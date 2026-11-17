//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream882.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { try { return bar(); } catch (e) {} } }
