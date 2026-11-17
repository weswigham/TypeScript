//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughCoreAuditGapsFallthroughJSRegexFallsIngThrough.ts] ////

//// [input.ts]
switch (value) { case 0: work(); /*  */ case 1: break; }

//// [input.ts]
switch (value) { case 0: work(); /*  */ case 1: break; }
