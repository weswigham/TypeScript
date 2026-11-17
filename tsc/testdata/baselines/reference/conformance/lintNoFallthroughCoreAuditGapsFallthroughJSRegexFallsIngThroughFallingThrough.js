//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughCoreAuditGapsFallthroughJSRegexFallsIngThroughFallingThrough.ts] ////

//// [input.ts]
switch (value) { case 0: work(); /* falling through */ case 1: break; }

//// [input.ts]
switch (value) { case 0: work(); /* falling through */ case 1: break; }
