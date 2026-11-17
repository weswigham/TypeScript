//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipOptionsAndEdgesCommentPattern.ts] ////

//// [input.ts]
declare const value: number; switch (value) { case 1: break;
 // intentionally omitted
 }

//// [input.ts]
declare const value: number; switch (value) { case 1: break;
 // intentionally omitted
 }
