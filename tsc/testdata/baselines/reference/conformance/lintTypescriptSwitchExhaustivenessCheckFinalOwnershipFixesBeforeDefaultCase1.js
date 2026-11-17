//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipFixesBeforeDefaultCase1.ts] ////

//// [input.ts]
declare const value: 'a' | 'b'; switch (value) { default: break; }

//// [input.ts]
declare const value: 'a' | 'b'; switch (value) { default: break; }
