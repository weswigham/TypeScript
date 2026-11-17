//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream630.ts] ////

//// [input.ts]
function someFunc() { do { try { return bar(); } catch (e) {} } while (a) }

//// [input.ts]
function someFunc() { do { try { return bar(); } catch (e) {} } while (a) }
