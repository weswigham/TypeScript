//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2227.ts] ////

//// [input.ts]
switch (foo) { case 0: try { throw 0; } catch (err) { break; } default: b(); }

//// [input.ts]
switch (foo) { case 0: try { throw 0; } catch (err) { break; } default: b(); }
