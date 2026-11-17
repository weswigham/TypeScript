//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipRulesUnnecessaryDefault.ts] ////

//// [input.ts]
declare const value: boolean; switch (value) { case true: case false: default: break; }

//// [input.ts]
declare const value: boolean; switch (value) { case true: case false: default: break; }
