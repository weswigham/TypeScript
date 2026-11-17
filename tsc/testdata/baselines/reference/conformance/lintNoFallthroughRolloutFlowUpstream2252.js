//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2252.ts] ////

//// [input.ts]
switch(foo) { case 0: try { throw 0; } catch (err) {} default: b() }

//// [input.ts]
switch(foo) { case 0: try { throw 0; } catch (err) {} default: b() }
