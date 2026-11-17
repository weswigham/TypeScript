//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipFixesUnionCasesCase1.ts] ////

//// [input.ts]
declare const value: 'a' | 'b'; switch (value) { case 'a': break; }

//// [input.ts]
declare const value: 'a' | 'b'; switch (value) { case 'a': break; }
