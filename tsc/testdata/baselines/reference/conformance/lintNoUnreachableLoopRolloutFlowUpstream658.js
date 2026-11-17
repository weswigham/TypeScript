//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream658.ts] ////

//// [input.ts]
function someFunc() { do { try { return bar(); } catch (e) {} } while (a && b) }

//// [input.ts]
function someFunc() { do { try { return bar(); } catch (e) {} } while (a && b) }
