//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1218.ts] ////

//// [input.ts]
function someFunc() { for (a of b) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (a of b) { try { return bar(); } catch (e) {} } }
