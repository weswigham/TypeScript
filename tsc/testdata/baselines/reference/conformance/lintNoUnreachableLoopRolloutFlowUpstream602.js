//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream602.ts] ////

//// [input.ts]
function someFunc() { while (a && b) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { while (a && b) { try { return bar(); } catch (e) {} } }
