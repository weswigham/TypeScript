//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughCoreAuditGapsFallthroughJSRegexFallS1FallFall.ts] ////

//// [input.ts]
switch (value) { case 0: work(); /* fall fall */ case 1: break; }

//// [input.ts]
switch (value) { case 0: work(); /* fall fall */ case 1: break; }
