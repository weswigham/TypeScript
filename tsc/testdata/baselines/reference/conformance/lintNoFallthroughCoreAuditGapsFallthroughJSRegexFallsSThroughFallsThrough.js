//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughCoreAuditGapsFallthroughJSRegexFallsSThroughFallsThrough.ts] ////

//// [input.ts]
switch (value) { case 0: work(); /* falls through */ case 1: break; }

//// [input.ts]
switch (value) { case 0: work(); /* falls through */ case 1: break; }
