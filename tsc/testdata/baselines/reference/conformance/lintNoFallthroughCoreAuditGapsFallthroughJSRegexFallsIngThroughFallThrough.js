//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughCoreAuditGapsFallthroughJSRegexFallsIngThroughFallThrough.ts] ////

//// [input.ts]
switch (value) { case 0: work(); /* fall through */ case 1: break; }

//// [input.ts]
switch (value) { case 0: work(); /* fall through */ case 1: break; }
