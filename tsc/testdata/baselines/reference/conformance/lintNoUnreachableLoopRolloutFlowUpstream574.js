//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream574.ts] ////

//// [input.ts]
function someFunc() { while (a) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { while (a) { try { return bar(); } catch (e) {} } }
